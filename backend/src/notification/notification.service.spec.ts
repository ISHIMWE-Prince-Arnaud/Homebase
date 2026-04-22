import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RealtimeEvents } from '../realtime/realtime.events';
import {
  createPrismaMock,
  createRealtimeMock,
  type MockPrismaService,
  type MockRealtimeService,
} from '../common/testing';

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaMock: MockPrismaService;
  let realtimeMock: MockRealtimeService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    realtimeMock = createRealtimeMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RealtimeService, useValue: realtimeMock },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  // ─── listByHousehold() ─────────────────────────────────────────────────────────

  describe('listByHousehold()', () => {
    it('should return household + user-scoped notifications', async () => {
      const notifications = [
        { id: 1, message: 'Chore created', householdId: 10, userId: null },
        { id: 2, message: 'Payment received', householdId: 10, userId: 1 },
      ];
      prismaMock.notification.findMany.mockResolvedValue(notifications);

      const result = await service.listByHousehold(10, 1);

      expect(result).toEqual(notifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: {
          householdId: 10,
          OR: [{ userId: null }, { userId: 1 }],
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(service.listByHousehold(0, 1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── markRead() ────────────────────────────────────────────────────────────────

  describe('markRead()', () => {
    it('should mark notification as read, emits NOTIFICATION_READ', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markRead(10, 1, 5);

      expect(result.count).toBe(1);
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.NOTIFICATION_READ,
        { id: 1 },
      );
    });

    it('should throw NotFoundException if notification not found', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.markRead(10, 999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create() ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should create household-scoped notification, emits to household room', async () => {
      const created = { id: 1, message: 'Test', householdId: 10, userId: null };
      prismaMock.notification.create.mockResolvedValue(created);

      const result = await service.create(10, 'Test', 'info');

      expect(result).toEqual(created);
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.NOTIFICATION_CREATED,
        { notification: created },
      );
    });

    it('should create user-targeted notification, emits to user room', async () => {
      const created = { id: 1, message: 'Test', householdId: 10, userId: 5 };
      prismaMock.notification.create.mockResolvedValue(created);

      const result = await service.create(10, 'Test', 'info', 5);

      expect(result).toEqual(created);
      expect(realtimeMock.emitToUser).toHaveBeenCalledWith(
        5,
        RealtimeEvents.NOTIFICATION_CREATED,
        { notification: created },
      );
      // Should NOT emit to household when user-targeted
      expect(realtimeMock.emitToHousehold).not.toHaveBeenCalled();
    });
  });

  // ─── markAllRead() ──────────────────────────────────────────────────────────────

  describe('markAllRead()', () => {
    it('should mark all unread notifications as read for user', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllRead(10, 1);

      expect(result.count).toBe(3);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          householdId: 10,
          isRead: false,
          OR: [{ userId: null }, { userId: 1 }],
        },
        data: { isRead: true },
      });
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(service.markAllRead(0, 1)).rejects.toThrow(BadRequestException);
    });
  });
});
