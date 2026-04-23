import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { RealtimeService } from 'src/realtime/realtime.service';
import { RealtimeEvents } from 'src/realtime/realtime.events';
import { CreateNeedDto } from './dto/create-need.dto';
import { MarkPurchasedDto } from './dto/mark-purchased.dto';
import { UpdateNeedDto } from './dto/update-need.dto';

@Injectable()
export class NeedService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private realtime: RealtimeService,
  ) {}

  async createNeed(householdId: number, userId: number, dto: CreateNeedDto) {
    if (!householdId) {
      throw new BadRequestException('householdId missing in context.');
    }
    const created = await this.prisma.householdNeed.create({
      data: {
        name: dto.name,
        quantity: dto.quantity,
        category: dto.category,
        householdId,
        addedById: userId,
      },
    });
    // fire-and-forget notification
    await this.notifications.create(
      householdId,
      'added',
      'need_added',
      undefined,
      userId,
      'need',
      created.id,
      'added',
    );
    this.realtime.emitToHousehold(householdId, RealtimeEvents.NEED_ITEM_ADDED, {
      need: created,
    });
    return created;
  }

  async getNeeds(householdId: number) {
    if (!householdId) {
      throw new BadRequestException('householdId missing in context.');
    }
    return this.prisma.householdNeed.findMany({
      where: { householdId },
      orderBy: [{ isPurchased: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateNeed(needId: number, householdId: number, dto: UpdateNeedDto) {
    const existing = await this.prisma.householdNeed.findFirst({
      where: { id: needId, householdId },
    });
    if (!existing) throw new NotFoundException('Need not found.');

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.category !== undefined) data.category = dto.category;

    const updated = await this.prisma.householdNeed.update({
      where: { id: needId },
      data,
    });
    this.realtime.emitToHousehold(
      householdId,
      RealtimeEvents.NEED_ITEM_UPDATED,
      { need: updated },
    );
    return updated;
  }

  async markPurchased(
    needId: number,
    householdId: number,
    userId: number,
    dto?: MarkPurchasedDto,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Ensure the acting user belongs to this household
      const actor = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, householdId: true },
      });
      if (!actor || actor.householdId !== householdId) {
        throw new BadRequestException('You do not belong to this household');
      }
      // Ensure the need exists and belongs to the household
      const need = await tx.householdNeed.findFirst({
        where: { id: needId, householdId },
        select: { id: true, name: true },
      });
      if (!need) throw new NotFoundException('Need not found.');

      // Mark as purchased
      await tx.householdNeed.update({
        where: { id: needId },
        data: {
          isPurchased: true,
          purchasedAt: new Date(),
          purchasedById: userId,
        },
      });

      let expenseId: number | undefined;
      let expenseDescription: string | undefined;
      if (dto?.createExpense) {
        if (!dto.amount || dto.amount <= 0)
          throw new BadRequestException(
            'amount must be > 0 when creating expense',
          );

        const amount = dto.amount;

        // Collect all household member IDs as participants
        const members = await tx.user.findMany({
          where: { householdId },
          select: { id: true },
        });
        const participantIds = members.map((m) => m.id);
        if (participantIds.length === 0) {
          throw new BadRequestException(
            'Household has no members to split expense',
          );
        }

        // Ensure the payer (userId) is included
        if (!participantIds.includes(userId)) participantIds.push(userId);

        // Distribute integer shares: base + remainder to first R participants
        const n = participantIds.length;
        const base = Math.floor(amount / n);
        const rem = amount % n;
        const created = await tx.expense.create({
          data: {
            description: dto.description || `Purchased: ${need.name}`,
            totalAmount: amount,
            paidById: userId,
            householdId,
            participants: {
              create: participantIds.map((uid, idx) => ({
                userId: uid,
                shareAmount: base + (idx < rem ? 1 : 0),
              })),
            },
          },
          select: { id: true },
        });
        expenseId = created.id;
        expenseDescription = dto.description || `Purchased: ${need.name}`;
      }

      const updatedNeed = await tx.householdNeed.findUnique({
        where: { id: needId },
      });
      return { need: updatedNeed, expenseId, expenseDescription };
    });

    // notifications (after commit)
    await this.notifications.create(
      householdId,
      'purchased',
      'need_purchased',
      undefined,
      userId,
      'need',
      result.need?.id,
      'purchased',
    );
    if (result.need) {
      this.realtime.emitToHousehold(
        householdId,
        RealtimeEvents.NEED_ITEM_PURCHASED,
        {
          need: result.need,
        },
      );
    }
    if (result.expenseId) {
      await this.notifications.create(
        householdId,
        'created expense',
        'expense_added',
        undefined,
        userId,
        'expense',
        result.expenseId,
        'created',
      );
      this.realtime.emitToHousehold(
        householdId,
        RealtimeEvents.NEED_EXPENSE_CREATED,
        {
          expenseId: result.expenseId,
          description: result.expenseDescription,
        },
      );
    }
    return result;
  }

  async deleteNeed(needId: number, householdId: number) {
    const deleted = await this.prisma.householdNeed.deleteMany({
      where: { id: needId, householdId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException('Need not found.');
    }
    return deleted;
  }
}
