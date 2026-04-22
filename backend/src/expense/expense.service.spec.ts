import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExpenseService } from './expense.service';
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

describe('ExpenseService', () => {
  let service: ExpenseService;
  let prismaMock: MockPrismaService;
  let realtimeMock: MockRealtimeService;
  let notificationMock: MockNotificationService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    realtimeMock = createRealtimeMock();
    notificationMock = createNotificationMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: RealtimeService, useValue: realtimeMock },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
  });

  // ─── createExpense() ───────────────────────────────────────────────────────────

  describe('createExpense()', () => {
    const householdId = 10;
    const userId = 1;
    const dto = {
      description: 'Groceries',
      totalAmount: 3000,
      paidById: 1,
      participants: [1, 2, 3],
    };
    const createdExpense = {
      id: 1,
      description: 'Groceries',
      totalAmount: 3000,
      paidById: 1,
      householdId: 10,
      participants: [
        { userId: 1, shareAmount: 1000 },
        { userId: 2, shareAmount: 1000 },
        { userId: 3, shareAmount: 1000 },
      ],
    };

    it('should create expense with even split among participants', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 1, householdId: 10 }) // payer check
        .mockResolvedValueOnce({ id: 1, name: 'Alice' }); // actor name
      prismaMock.user.findMany.mockResolvedValueOnce([
        { id: 1, householdId: 10 },
        { id: 2, householdId: 10 },
        { id: 3, householdId: 10 },
      ]);
      prismaMock.expense.create.mockResolvedValue(createdExpense);
      notificationMock.create.mockResolvedValue({});

      const result = await service.createExpense(householdId, userId, dto);

      expect(result.totalAmount).toBe(3000);
      const createCall = prismaMock.expense.create.mock.calls[0][0];
      const shares = createCall.data.participants.create.map((p: any) => p.shareAmount);
      expect(shares).toEqual([1000, 1000, 1000]);
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(
        service.createExpense(0, userId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if userId !== paidById', async () => {
      await expect(
        service.createExpense(householdId, 99, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if payer not in same household', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, householdId: 99 });

      await expect(
        service.createExpense(householdId, userId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if participants array empty', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, householdId: 10 });

      await expect(
        service.createExpense(householdId, userId, { ...dto, participants: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if paidById not in participants', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, householdId: 10 });

      await expect(
        service.createExpense(householdId, userId, { ...dto, participants: [2, 3] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if any participant not in same household', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, householdId: 10 });
      prismaMock.user.findMany.mockResolvedValueOnce([
        { id: 1, householdId: 10 },
        { id: 2, householdId: 10 },
        { id: 3, householdId: 99 }, // different household
      ]);

      await expect(
        service.createExpense(householdId, userId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create notification and emit EXPENSE_CREATED + EXPENSE_BALANCE_UPDATED', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 1, householdId: 10 })
        .mockResolvedValueOnce({ id: 1, name: 'Alice' });
      prismaMock.user.findMany.mockResolvedValueOnce([
        { id: 1, householdId: 10 },
        { id: 2, householdId: 10 },
        { id: 3, householdId: 10 },
      ]);
      prismaMock.expense.create.mockResolvedValue(createdExpense);
      notificationMock.create.mockResolvedValue({});

      await service.createExpense(householdId, userId, dto);

      expect(notificationMock.create).toHaveBeenCalled();
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.EXPENSE_CREATED,
        expect.any(Object),
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.EXPENSE_BALANCE_UPDATED,
        expect.any(Object),
      );
    });
  });

  // ─── getExpenses() ─────────────────────────────────────────────────────────────

  describe('getExpenses()', () => {
    it('should return expenses with participants and paidBy', async () => {
      const expenses = [
        { id: 1, description: 'Groceries', participants: [], paidBy: { id: 1, name: 'Alice' } },
      ];
      prismaMock.expense.findMany.mockResolvedValue(expenses);

      const result = await service.getExpenses(10);

      expect(result).toEqual(expenses);
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(service.getExpenses(0)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getBalance() ──────────────────────────────────────────────────────────────

  describe('getBalance()', () => {
    it('should compute net balance per user (paid - owes)', async () => {
      // User 1 paid 3000, User 2 paid 0, User 3 paid 0
      prismaMock.expense.groupBy.mockResolvedValue([
        { paidById: 1, _sum: { totalAmount: 3000 } },
      ]);
      prismaMock.expense.findMany.mockResolvedValue([{ id: 1 }]);
      // Each owes 1000
      prismaMock.expenseParticipant.groupBy.mockResolvedValue([
        { userId: 1, _sum: { shareAmount: 1000 } },
        { userId: 2, _sum: { shareAmount: 1000 } },
        { userId: 3, _sum: { shareAmount: 1000 } },
      ]);
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, name: 'Alice', email: 'a@b.com' },
        { id: 2, name: 'Bob', email: 'b@b.com' },
        { id: 3, name: 'Carol', email: 'c@b.com' },
      ]);

      const result = await service.getBalance(10);

      expect(result).toHaveLength(3);
      const alice = result.find((r: any) => r.userId === 1);
      expect(alice).toBeDefined();
      expect(alice!.net).toBe(2000); // 3000 paid - 1000 owes
      const bob = result.find((r: any) => r.userId === 2);
      expect(bob).toBeDefined();
      expect(bob!.net).toBe(-1000); // 0 paid - 1000 owes
    });

    it('should apply payments correctly', async () => {
      prismaMock.expense.groupBy.mockResolvedValue([
        { paidById: 1, _sum: { totalAmount: 3000 } },
      ]);
      prismaMock.expense.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.expenseParticipant.groupBy.mockResolvedValue([
        { userId: 1, _sum: { shareAmount: 1000 } },
        { userId: 2, _sum: { shareAmount: 1000 } },
        { userId: 3, _sum: { shareAmount: 1000 } },
      ]);
      // User 2 paid User 1: 500
      prismaMock.payment.findMany.mockResolvedValue([
        { fromUserId: 2, toUserId: 1, amount: 500 },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, name: 'Alice', email: 'a@b.com' },
        { id: 2, name: 'Bob', email: 'b@b.com' },
        { id: 3, name: 'Carol', email: 'c@b.com' },
      ]);

      const result = await service.getBalance(10);

      const alice = result.find((r: any) => r.userId === 1);
      expect(alice).toBeDefined();
      expect(alice!.net).toBe(1500); // 3000 paid - 1000 owes - 500 received payment
      const bob = result.find((r: any) => r.userId === 2);
      expect(bob).toBeDefined();
      expect(bob!.net).toBe(-500); // 0 paid - 1000 owes + 500 paid
    });

    it('should return empty array when no expenses', async () => {
      prismaMock.expense.groupBy.mockResolvedValue([]);
      prismaMock.expense.findMany.mockResolvedValue([]);
      prismaMock.expenseParticipant.groupBy.mockResolvedValue([]);
      prismaMock.payment.findMany.mockResolvedValue([]);

      const result = await service.getBalance(10);

      expect(result).toEqual([]);
    });
  });

  // ─── getSettlements() ──────────────────────────────────────────────────────────

  describe('getSettlements()', () => {
    it('should compute minimal pairwise settlements using greedy algorithm', async () => {
      // User 1 paid 3000, others owe 1000 each
      prismaMock.expense.groupBy.mockResolvedValue([
        { paidById: 1, _sum: { totalAmount: 3000 } },
      ]);
      prismaMock.expense.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.expenseParticipant.groupBy.mockResolvedValue([
        { userId: 1, _sum: { shareAmount: 1000 } },
        { userId: 2, _sum: { shareAmount: 1000 } },
        { userId: 3, _sum: { shareAmount: 1000 } },
      ]);
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, name: 'Alice', email: 'a@b.com' },
        { id: 2, name: 'Bob', email: 'b@b.com' },
        { id: 3, name: 'Carol', email: 'c@b.com' },
      ]);

      const result = await service.getSettlements(10);

      expect(result.settlements).toHaveLength(2);
      // Both Bob and Carol should owe Alice 1000
      const fromBob = result.settlements.find((s: any) => s.fromUserId === 2);
      expect(fromBob).toBeDefined();
      expect(fromBob!.amount).toBe(1000);
      expect(fromBob!.toUserId).toBe(1);
      const fromCarol = result.settlements.find((s: any) => s.fromUserId === 3);
      expect(fromCarol).toBeDefined();
      expect(fromCarol!.amount).toBe(1000);
      expect(fromCarol!.toUserId).toBe(1);
    });

    it('should apply existing payments to net before settlement calculation', async () => {
      prismaMock.expense.groupBy.mockResolvedValue([
        { paidById: 1, _sum: { totalAmount: 3000 } },
      ]);
      prismaMock.expense.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.expenseParticipant.groupBy.mockResolvedValue([
        { userId: 1, _sum: { shareAmount: 1000 } },
        { userId: 2, _sum: { shareAmount: 1000 } },
        { userId: 3, _sum: { shareAmount: 1000 } },
      ]);
      // Bob already paid 500 to Alice
      prismaMock.payment.findMany.mockResolvedValue([
        { fromUserId: 2, toUserId: 1, amount: 500 },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, name: 'Alice', email: 'a@b.com' },
        { id: 2, name: 'Bob', email: 'b@b.com' },
        { id: 3, name: 'Carol', email: 'c@b.com' },
      ]);

      const result = await service.getSettlements(10);

      const fromBob = result.settlements.find((s: any) => s.fromUserId === 2);
      expect(fromBob).toBeDefined();
      expect(fromBob!.amount).toBe(500); // 1000 - 500 already paid
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(service.getSettlements(0)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getMySettlements() ────────────────────────────────────────────────────────

  describe('getMySettlements()', () => {
    it('should filter settlements involving the requesting user only', async () => {
      prismaMock.expense.groupBy.mockResolvedValue([
        { paidById: 1, _sum: { totalAmount: 3000 } },
      ]);
      prismaMock.expense.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.expenseParticipant.groupBy.mockResolvedValue([
        { userId: 1, _sum: { shareAmount: 1000 } },
        { userId: 2, _sum: { shareAmount: 1000 } },
        { userId: 3, _sum: { shareAmount: 1000 } },
      ]);
      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, name: 'Alice', email: 'a@b.com' },
        { id: 2, name: 'Bob', email: 'b@b.com' },
        { id: 3, name: 'Carol', email: 'c@b.com' },
      ]);

      const result = await service.getMySettlements(10, 2);

      // User 2 only appears in settlements with User 1
      expect(result.settlements.length).toBeGreaterThan(0);
      result.settlements.forEach((s: any) => {
        expect(s.fromUserId === 2 || s.toUserId === 2).toBe(true);
      });
    });
  });
});
