import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
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

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaMock: MockPrismaService;
  let realtimeMock: MockRealtimeService;
  let notificationMock: MockNotificationService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    realtimeMock = createRealtimeMock();
    notificationMock = createNotificationMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: RealtimeService, useValue: realtimeMock },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  // ─── createPayment() ───────────────────────────────────────────────────────────

  describe('createPayment()', () => {
    const householdId = 10;
    const fromUserId = 2;
    const dto = { toUserId: 1, amount: 500 };
    const payment = {
      id: 1,
      fromUserId: 2,
      toUserId: 1,
      amount: 500,
      householdId: 10,
    };

    // Helper to set up mocks for a valid direct debt scenario
    function setupValidDebtMocks() {
      // User 1 paid 3000, User 2 owes 1000, User 3 owes 1000
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
    }

    it('should create payment when valid direct debt exists', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 2, householdId: 10, name: 'Bob' }) // fromUser
        .mockResolvedValueOnce({ id: 1, householdId: 10, name: 'Alice' }); // toUser
      setupValidDebtMocks();
      prismaMock.payment.create.mockResolvedValue(payment);
      notificationMock.create.mockResolvedValue({});

      const result = await service.createPayment(householdId, fromUserId, dto);

      expect(result.payment).toEqual(payment);
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(service.createPayment(0, fromUserId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if fromUserId === toUserId', async () => {
      await expect(
        service.createPayment(householdId, 1, { toUserId: 1, amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount ≤ 0', async () => {
      await expect(
        service.createPayment(householdId, fromUserId, {
          toUserId: 1,
          amount: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createPayment(householdId, fromUserId, {
          toUserId: 1,
          amount: -100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payer not found', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null) // fromUser not found
        .mockResolvedValueOnce({ id: 1, householdId: 10, name: 'Alice' });

      await expect(
        service.createPayment(householdId, fromUserId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if receiver not found', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 2, householdId: 10, name: 'Bob' })
        .mockResolvedValueOnce(null); // toUser not found

      await expect(
        service.createPayment(householdId, fromUserId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if users not in same household', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 2, householdId: 10, name: 'Bob' })
        .mockResolvedValueOnce({ id: 1, householdId: 99, name: 'Alice' }); // different household

      await expect(
        service.createPayment(householdId, fromUserId, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if no direct debt between users', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 2, householdId: 10, name: 'Bob' })
        .mockResolvedValueOnce({ id: 1, householdId: 10, name: 'Alice' });
      // No expenses => no debt
      prismaMock.expense.groupBy.mockResolvedValue([]);
      prismaMock.expense.findMany.mockResolvedValue([]);
      prismaMock.payment.findMany.mockResolvedValue([]);

      await expect(
        service.createPayment(householdId, fromUserId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment exceeds direct debt', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 2, householdId: 10, name: 'Bob' })
        .mockResolvedValueOnce({ id: 1, householdId: 10, name: 'Alice' });
      setupValidDebtMocks(); // User 2 owes User 1 exactly 1000

      await expect(
        service.createPayment(householdId, fromUserId, {
          toUserId: 1,
          amount: 5000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send notification to receiver and emit PAYMENT_RECORDED + EXPENSE_BALANCE_UPDATED', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 2, householdId: 10, name: 'Bob' })
        .mockResolvedValueOnce({ id: 1, householdId: 10, name: 'Alice' });
      setupValidDebtMocks();
      prismaMock.payment.create.mockResolvedValue(payment);
      notificationMock.create.mockResolvedValue({});

      await service.createPayment(householdId, fromUserId, dto);

      expect(notificationMock.create).toHaveBeenCalledWith(
        householdId,
        'paid',
        'payment_received',
        1, // toUserId
        2, // fromUserId
        'payment',
        1, // payment.id
        'paid',
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.PAYMENT_RECORDED,
        expect.any(Object),
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.EXPENSE_BALANCE_UPDATED,
        expect.any(Object),
      );
    });

    it('should return remaining direct debt after payment', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: 2, householdId: 10, name: 'Bob' })
        .mockResolvedValueOnce({ id: 1, householdId: 10, name: 'Alice' });
      // First getDirectDebtAmount call: no existing payments → debt=1000
      // Second getDirectDebtAmount call: payment now recorded → debt=500
      prismaMock.expense.groupBy.mockResolvedValue([
        { paidById: 1, _sum: { totalAmount: 3000 } },
      ]);
      prismaMock.expense.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.expenseParticipant.groupBy.mockResolvedValue([
        { userId: 1, _sum: { shareAmount: 1000 } },
        { userId: 2, _sum: { shareAmount: 1000 } },
        { userId: 3, _sum: { shareAmount: 1000 } },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, name: 'Alice', email: 'a@b.com' },
        { id: 2, name: 'Bob', email: 'b@b.com' },
        { id: 3, name: 'Carol', email: 'c@b.com' },
      ]);
      prismaMock.payment.findMany
        .mockResolvedValueOnce([]) // before payment creation
        .mockResolvedValueOnce([{ fromUserId: 2, toUserId: 1, amount: 500 }]); // after payment creation
      prismaMock.payment.create.mockResolvedValue(payment);
      notificationMock.create.mockResolvedValue({});

      const result = await service.createPayment(householdId, fromUserId, dto);

      expect(result.remainingDirectDebt).toBeDefined();
      // After paying 500 of 1000 debt, remaining should be 500
      expect(result.remainingDirectDebt).toBe(500);
    });
  });

  // ─── getPayments() ─────────────────────────────────────────────────────────────

  describe('getPayments()', () => {
    it('should return payments with fromUser/toUser info', async () => {
      const payments = [
        {
          id: 1,
          fromUserId: 2,
          toUserId: 1,
          amount: 500,
          fromUser: { id: 2, name: 'Bob', email: 'b@b.com' },
          toUser: { id: 1, name: 'Alice', email: 'a@b.com' },
        },
      ];
      prismaMock.payment.findMany.mockResolvedValue(payments);

      const result = await service.getPayments(10);

      expect(result).toEqual(payments);
    });

    it('should throw BadRequestException if no householdId', async () => {
      await expect(service.getPayments(0)).rejects.toThrow(BadRequestException);
    });
  });
});
