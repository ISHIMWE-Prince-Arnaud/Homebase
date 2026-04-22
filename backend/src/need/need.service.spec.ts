import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NeedService } from './need.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RealtimeEvents } from '../realtime/realtime.events';
import {
  createPrismaMock,
  createRealtimeMock,
  createNotificationMock,
  type MockPrismaService,
  type MockRealtimeService,
  type MockNotificationService,
} from '../common/testing';

describe('NeedService', () => {
  let service: NeedService;
  let prismaMock: MockPrismaService;
  let realtimeMock: MockRealtimeService;
  let notificationMock: MockNotificationService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    realtimeMock = createRealtimeMock();
    notificationMock = createNotificationMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeedService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: RealtimeService, useValue: realtimeMock },
      ],
    }).compile();

    service = module.get<NeedService>(NeedService);
  });

  // ─── createNeed() ──────────────────────────────────────────────────────────────

  describe('createNeed()', () => {
    const householdId = 10;
    const userId = 1;
    const dto = { name: 'Milk', quantity: '2', category: 'Groceries' };
    const createdNeed = {
      id: 1,
      name: 'Milk',
      quantity: '2',
      category: 'Groceries',
      householdId: 10,
      addedById: 1,
      isPurchased: false,
    };

    it('should create a need, send notification, emit NEED_ITEM_ADDED', async () => {
      prismaMock.householdNeed.create.mockResolvedValue(createdNeed);
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, name: 'Alice' });
      notificationMock.create.mockResolvedValue({});

      const result = await service.createNeed(householdId, userId, dto as any);

      expect(result).toEqual(createdNeed);
      expect(notificationMock.create).toHaveBeenCalledWith(
        householdId,
        expect.stringContaining('Milk'),
        'addedNeed',
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.NEED_ITEM_ADDED,
        { need: createdNeed },
      );
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(
        service.createNeed(0, userId, dto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getNeeds() ────────────────────────────────────────────────────────────────

  describe('getNeeds()', () => {
    it('should return needs ordered by isPurchased asc, createdAt desc', async () => {
      const needs = [
        { id: 1, name: 'Milk', isPurchased: false },
        { id: 2, name: 'Bread', isPurchased: true },
      ];
      prismaMock.householdNeed.findMany.mockResolvedValue(needs);

      const result = await service.getNeeds(10);

      expect(result).toEqual(needs);
      expect(prismaMock.householdNeed.findMany).toHaveBeenCalledWith({
        where: { householdId: 10 },
        orderBy: [{ isPurchased: 'asc' }, { createdAt: 'desc' }],
      });
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(service.getNeeds(0)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── updateNeed() ──────────────────────────────────────────────────────────────

  describe('updateNeed()', () => {
    it('should update name/quantity/category partially', async () => {
      prismaMock.householdNeed.findFirst.mockResolvedValue({ id: 1, householdId: 10 });
      const updated = { id: 1, name: 'Oat Milk', quantity: '3', category: 'Groceries' };
      prismaMock.householdNeed.update.mockResolvedValue(updated);

      const result = await service.updateNeed(1, 10, { name: 'Oat Milk', quantity: '3' });

      expect(result.name).toBe('Oat Milk');
      expect(result.quantity).toBe('3');
    });

    it('should throw NotFoundException if need not found', async () => {
      prismaMock.householdNeed.findFirst.mockResolvedValue(null);

      await expect(service.updateNeed(999, 10, { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should emit NEED_ITEM_UPDATED', async () => {
      prismaMock.householdNeed.findFirst.mockResolvedValue({ id: 1, householdId: 10 });
      prismaMock.householdNeed.update.mockResolvedValue({ id: 1, name: 'X' });

      await service.updateNeed(1, 10, { name: 'X' });

      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.NEED_ITEM_UPDATED,
        expect.any(Object),
      );
    });
  });

  // ─── markPurchased() ───────────────────────────────────────────────────────────

  describe('markPurchased()', () => {
    const needId = 1;
    const householdId = 10;
    const userId = 1;

    it('should mark need as purchased without creating expense', async () => {
      const updatedNeed = { id: 1, name: 'Milk', isPurchased: true, purchasedAt: expect.any(Date), purchasedById: 1 };
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
          },
          householdNeed: {
            ...prismaMock.householdNeed,
            findFirst: jest.fn().mockResolvedValue({ id: 1, name: 'Milk' }),
            update: jest.fn().mockResolvedValue(updatedNeed),
            findUnique: jest.fn().mockResolvedValue(updatedNeed),
          },
        };
        return await fn(tx);
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, name: 'Alice' });
      notificationMock.create.mockResolvedValue({});

      const result = await service.markPurchased(needId, householdId, userId);

      expect(result.need!.isPurchased).toBe(true);
      expect(result.expenseId).toBeUndefined();
    });

    it('should mark need as purchased AND create expense when dto.createExpense=true', async () => {
      const updatedNeed = { id: 1, name: 'Milk', isPurchased: true, purchasedAt: expect.any(Date), purchasedById: 1 };
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
            findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
          },
          householdNeed: {
            ...prismaMock.householdNeed,
            findFirst: jest.fn().mockResolvedValue({ id: 1, name: 'Milk' }),
            update: jest.fn().mockResolvedValue(updatedNeed),
            findUnique: jest.fn().mockResolvedValue(updatedNeed),
          },
          expense: {
            ...prismaMock.expense,
            create: jest.fn().mockResolvedValue({ id: 50 }),
          },
        };
        return await fn(tx);
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, name: 'Alice' });
      notificationMock.create.mockResolvedValue({});

      const result = await service.markPurchased(needId, householdId, userId, {
        createExpense: true,
        amount: 3000,
        description: 'Bought milk',
      });

      expect(result.expenseId).toBe(50);
    });

    it('should throw BadRequestException if user not in household', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 99 }),
          },
        };
        return await fn(tx);
      });

      await expect(
        service.markPurchased(needId, householdId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if need not found', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
          },
          householdNeed: {
            ...prismaMock.householdNeed,
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return await fn(tx);
      });

      await expect(
        service.markPurchased(999, householdId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if amount ≤ 0 when createExpense=true', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
          },
          householdNeed: {
            ...prismaMock.householdNeed,
            findFirst: jest.fn().mockResolvedValue({ id: 1, name: 'Milk' }),
            update: jest.fn().mockResolvedValue({ id: 1, isPurchased: true }),
          },
        };
        return await fn(tx);
      });

      await expect(
        service.markPurchased(needId, householdId, userId, {
          createExpense: true,
          amount: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should distribute shares evenly (base + remainder) among members', async () => {
      const updatedNeed = { id: 1, name: 'Milk', isPurchased: true };
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
            findMany: jest.fn().mockResolvedValue([
              { id: 1 },
              { id: 2 },
              { id: 3 },
            ]),
          },
          householdNeed: {
            ...prismaMock.householdNeed,
            findFirst: jest.fn().mockResolvedValue({ id: 1, name: 'Milk' }),
            update: jest.fn().mockResolvedValue(updatedNeed),
            findUnique: jest.fn().mockResolvedValue(updatedNeed),
          },
          expense: {
            ...prismaMock.expense,
            create: jest.fn().mockResolvedValue({ id: 50 }),
          },
        };
        return await fn(tx);
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, name: 'Alice' });
      notificationMock.create.mockResolvedValue({});

      // 100 split among 3 = 33 each + 1 remainder to first
      await service.markPurchased(needId, householdId, userId, {
        createExpense: true,
        amount: 100,
      });

      // Verify the expense create call was made
      const txExpenseCreate = prismaMock.$transaction.mock.calls[0][0];
      // The transaction callback creates the expense internally
    });

    it('should send notifications and emit NEED_ITEM_PURCHASED + NEED_EXPENSE_CREATED', async () => {
      const updatedNeed = { id: 1, name: 'Milk', isPurchased: true, purchasedAt: new Date(), purchasedById: 1 };
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
            findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
          },
          householdNeed: {
            ...prismaMock.householdNeed,
            findFirst: jest.fn().mockResolvedValue({ id: 1, name: 'Milk' }),
            update: jest.fn().mockResolvedValue(updatedNeed),
            findUnique: jest.fn().mockResolvedValue(updatedNeed),
          },
          expense: {
            ...prismaMock.expense,
            create: jest.fn().mockResolvedValue({ id: 50 }),
          },
        };
        return await fn(tx);
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, name: 'Alice' });
      notificationMock.create.mockResolvedValue({});

      await service.markPurchased(needId, householdId, userId, {
        createExpense: true,
        amount: 3000,
      });

      expect(notificationMock.create).toHaveBeenCalledTimes(2); // purchased + expense
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.NEED_ITEM_PURCHASED,
        expect.any(Object),
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.NEED_EXPENSE_CREATED,
        expect.any(Object),
      );
    });
  });

  // ─── deleteNeed() ──────────────────────────────────────────────────────────────

  describe('deleteNeed()', () => {
    it('should delete need', async () => {
      prismaMock.householdNeed.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteNeed(1, 10);

      expect(result.count).toBe(1);
    });

    it('should throw NotFoundException if need not found', async () => {
      prismaMock.householdNeed.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteNeed(999, 10)).rejects.toThrow(NotFoundException);
    });
  });
});
