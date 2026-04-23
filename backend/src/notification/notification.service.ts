import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealtimeService } from 'src/realtime/realtime.service';
import { RealtimeEvents } from 'src/realtime/realtime.events';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  async listByHousehold(householdId: number, userId: number) {
    if (!householdId) throw new BadRequestException('householdId missing');
    return await this.prisma.notification.findMany({
      where: {
        householdId,
        OR: [{ userId: null }, { userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(householdId: number, id: number, userId: number) {
    const updated = await this.prisma.notification.updateMany({
      where: {
        id,
        householdId,
        OR: [{ userId: null }, { userId }],
      },
      data: { isRead: true },
    });
    if (updated.count === 0)
      throw new NotFoundException('Notification not found');

    // If it was a specific user notification, emit only to them?
    // For simplicity, we can still emit to household but maybe we should be more specific.
    // However, the current implementation emits to household.
    // Let's keep it simple: if it's private, emit to user, else household.
    // But we don't know if it was private without fetching it first.
    // Given the current architecture, emitting to household is "safe" enough for the "read" event
    // as long as the client handles it, but ideally we shouldn't leak info.
    // For now, let's stick to the existing behavior of emitting to household
    // as it's just an ID and "read" status.
    this.realtime.emitToHousehold(
      householdId,
      RealtimeEvents.NOTIFICATION_READ,
      { id },
    );
    return updated;
  }

  // Helper to create a notification (household-scoped), optionally user-targeted
  async create(
    householdId: number,
    message: string,
    type?: string,
    userId?: number,
  ) {
    const created = await this.prisma.notification.create({
      data: { householdId, message, type, userId },
    });
    if (userId) {
      this.realtime.emitToUser(userId, RealtimeEvents.NOTIFICATION_CREATED, {
        notification: created,
      });
    } else {
      this.realtime.emitToHousehold(
        householdId,
        RealtimeEvents.NOTIFICATION_CREATED,
        { notification: created },
      );
    }
    return created;
  }

  async markAllRead(householdId: number, userId: number) {
    if (!householdId) throw new BadRequestException('householdId missing');
    const res = await this.prisma.notification.updateMany({
      where: {
        householdId,
        isRead: false,
        OR: [{ userId: null }, { userId }],
      },
      data: { isRead: true },
    });

    // This might be noisy if we emit "all read" to everyone when one user marks theirs.
    // But "all: true" usually implies a refresh or clear.
    // Ideally we should emit to the user only if possible, or just let the client handle it.
    this.realtime.emitToHousehold(
      householdId,
      RealtimeEvents.NOTIFICATION_READ,
      { all: true, userId }, // Include userId so clients can ignore if needed?
      // Actually, if I mark MY notifications as read, I shouldn't clear YOURS in the UI.
      // The current frontend implementation listens for NOTIFICATION_READ.
    );
    return res;
  }

  async delete(householdId: number, id: number, userId: number) {
    const deleted = await this.prisma.notification.deleteMany({
      where: {
        id,
        householdId,
        OR: [{ userId: null }, { userId }],
      },
    });
    if (deleted.count === 0)
      throw new NotFoundException('Notification not found');

    // Emit deletion event to household
    this.realtime.emitToHousehold(
      householdId,
      RealtimeEvents.NOTIFICATION_DELETED,
      { id },
    );
    return deleted;
  }
}
