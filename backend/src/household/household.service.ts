import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { JoinHouseholdDto } from './dto/join-household.dto';
import * as crypto from 'crypto';
import { RealtimeService } from 'src/realtime/realtime.service';
import { RealtimeEvents } from 'src/realtime/realtime.events';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class HouseholdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationService,
  ) {}

  private generateInviteCode(length = 8): string {
    // alphanumeric uppercase
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }

  private async generateUniqueInviteCode(retries = 5): Promise<string> {
    for (let i = 0; i < retries; i++) {
      const candidate = this.generateInviteCode(8);
      const exists = await this.prisma.household.findUnique({
        where: { inviteCode: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    // fallback to a GUID-like code (extremely unlikely collision)
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  }

  /**
   * Create a new household and set the creating user as a member (user.householdId)
   * - If the user already has a household, throw BadRequestException (no switching).
   */
  async createHousehold(userId: number, dto: CreateHouseholdDto) {
    // fetch user to verify current state
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user) throw new NotFoundException('User not found.');

    if (user.householdId) {
      // You may change to ForbiddenException depending on policy
      throw new BadRequestException(
        'You already belong to a household. Leave it before creating a new one.',
      );
    }

    const inviteCode = await this.generateUniqueInviteCode();

    const household = await this.prisma.household.create({
      data: {
        name: dto.name,
        inviteCode,
        users: {
          connect: { id: userId }, // creator auto-joins
        },
      },
      include: {
        users: {
          select: { id: true, email: true, name: true, profileImage: true },
        },
      },
    });
    // notify/sync membership
    await this.realtime.syncUserHousehold(userId, household.id, null);
    this.realtime.emitToHousehold(
      household.id,
      RealtimeEvents.HOUSEHOLD_MEMBER_JOINED,
      { userId },
    );
    return household;
  }

  /**
   * Join a household given an inviteCode.
   * Rules:
   *  - If inviteCode not found -> NotFoundException
   *  - If user already in a household -> BadRequestException (no switching)
   */
  async joinHousehold(userId: number, dto: JoinHouseholdDto) {
    // Check user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const result = await this.prisma.$transaction(async (tx) => {
      const household = await tx.household.findUnique({
        where: { inviteCode: dto.inviteCode },
        include: {
          users: {
            select: { id: true, email: true, name: true, profileImage: true },
          },
        },
      });

      if (!household) throw new NotFoundException('Invalid invite code.');

      if (user.householdId) {
        const exists = await tx.household.findUnique({
          where: { id: user.householdId },
          select: { id: true },
        });
        if (exists) {
          throw new BadRequestException(
            'You already belong to a household. Leaving current household before joining is required.',
          );
        } else {
          await tx.user.update({
            where: { id: userId },
            data: { householdId: null },
          });
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: { householdId: household.id },
      });

      const updated = await tx.household.findUnique({
        where: { id: household.id },
        include: {
          users: {
            select: { id: true, email: true, name: true, profileImage: true },
          },
        },
      });

      return updated;
    });
    // sync and broadcast join
    const prev = null; // previous handled in transaction; may have been null or dangling
    await this.realtime.syncUserHousehold(userId, result!.id, prev);
    this.realtime.emitToHousehold(
      result!.id,
      RealtimeEvents.HOUSEHOLD_MEMBER_JOINED,
      { userId },
    );
    // Notification to household members about new member
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    await this.notifications.create(
      result!.id,
      `${actor?.name ?? 'A member'} joined the household`,
      'household_invite',
    );
    return result;
  }

  /**
   * Get "my" household for the given user.
   * - If user has no household -> NotFoundException
   * - Return household + members
   */
  async getMyHousehold(userId: number) {
    // get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user) throw new NotFoundException('User not found.');

    if (!user.householdId) {
      throw new NotFoundException('User does not belong to any household.');
    }

    const household = await this.prisma.household.findUnique({
      where: { id: user.householdId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!household) {
      // Data inconsistency: user's householdId points to missing household
      throw new NotFoundException('Household not found.');
    }

    return household;
  }

  /**
   * (Optional helper) enforce that the calling user belongs to a given household id (multi-tenant)
   * throws ForbiddenException if not.
   */
  async ensureUserBelongsToHousehold(userId: number, householdId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user) throw new NotFoundException('User not found.');
    if (!user.householdId || user.householdId !== householdId) {
      throw new ForbiddenException('You do not have access to this household.');
    }
  }

  async leaveHousehold(userId: number) {
    let deletedHouseholdId: number | null = null;
    let householdIdForSync: number | null = null;
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, householdId: true },
      });

      if (!user) throw new NotFoundException('User not found.');
      if (!user.householdId) {
        throw new BadRequestException('User does not belong to any household.');
      }

      const householdId = user.householdId;
      householdIdForSync = householdId;

      // Prevent leaving if the user has outstanding balance (net != 0)
      // net = (paid - owes) + paymentsFrom - paymentsTo
      const paidAgg = await tx.expense.aggregate({
        where: { householdId, paidById: userId },
        _sum: { totalAmount: true },
      });
      const owesAgg = await tx.expenseParticipant.aggregate({
        where: { userId, expense: { householdId } },
        _sum: { shareAmount: true },
      });
      const paymentsFromAgg = await tx.payment.aggregate({
        where: { householdId, fromUserId: userId },
        _sum: { amount: true },
      });
      const paymentsToAgg = await tx.payment.aggregate({
        where: { householdId, toUserId: userId },
        _sum: { amount: true },
      });

      const paidSum = paidAgg._sum.totalAmount || 0;
      const owesSum = owesAgg._sum.shareAmount || 0;
      const paymentsFrom = paymentsFromAgg._sum.amount || 0;
      const paymentsTo = paymentsToAgg._sum.amount || 0;
      const net = Number(
        (paidSum - owesSum + paymentsFrom - paymentsTo).toFixed(2),
      );
      if (Math.abs(net) > 0.01) {
        throw new BadRequestException(
          'You must settle your balance before leaving the household.',
        );
      }

      // Remove the user from the household
      await tx.user.update({
        where: { id: userId },
        data: { householdId: null },
      });

      // Auto-unassign chores assigned to this user within the household
      await tx.chore.updateMany({
        where: { householdId, assignedToId: userId },
        data: { assignedToId: null },
      });

      // Check if any members remain
      const remaining = await tx.user.count({ where: { householdId } });
      if (remaining === 0) {
        // Clean up dependent records before deleting the household
        const expenseIds = await tx.expense.findMany({
          where: { householdId },
          select: { id: true },
        });
        const ids = expenseIds.map((e) => e.id);
        if (ids.length) {
          await tx.expenseParticipant.deleteMany({
            where: { expenseId: { in: ids } },
          });
        }
        await tx.expense.deleteMany({ where: { householdId } });
        await tx.chore.deleteMany({ where: { householdId } });
        await tx.householdNeed.deleteMany({ where: { householdId } });
        await tx.payment.deleteMany({ where: { householdId } });
        await tx.notification.deleteMany({ where: { householdId } });

        await tx.household.delete({ where: { id: householdId } });
        deletedHouseholdId = householdId;
      }
    });
    // Post-commit: sync and broadcast
    if (householdIdForSync !== null) {
      await this.realtime.syncUserHousehold(userId, null, householdIdForSync);
      this.realtime.emitToHousehold(
        householdIdForSync,
        RealtimeEvents.HOUSEHOLD_MEMBER_LEFT,
        { userId },
      );
    }
    if (deletedHouseholdId !== null) {
      this.realtime.emitToHousehold(
        deletedHouseholdId,
        RealtimeEvents.HOUSEHOLD_DELETED,
        { householdId: deletedHouseholdId },
      );
    }
  }
}
