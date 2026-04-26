import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { HouseholdService } from './household.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationService } from '../notification/notification.service';
import { RealtimeEvents } from '../realtime/realtime.events';
import {
  createPrismaMock,
  createRealtimeMock,
  createNotificationMock,
  type MockPrismaService,
  type MockRealtimeService,
  type MockNotificationService,
} from '../common/testing';

describe('HouseholdService', () => {
  let service: HouseholdService;
  let prismaMock: MockPrismaService;
  let realtimeMock: MockRealtimeService;
  let notificationMock: MockNotificationService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    realtimeMock = createRealtimeMock();
    notificationMock = createNotificationMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RealtimeService, useValue: realtimeMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = module.get<HouseholdService>(HouseholdService);
  });

  // ─── createHousehold() ─────────────────────────────────────────────────────────

  describe('createHousehold()', () => {
    const userId = 1;
    const dto = { name: 'Test Home' };
    const household = {
      id: 10,
      name: 'Test Home',
      inviteCode: 'ABC12345',
      users: [{ id: 1, email: 'a@b.com', name: 'Alice' }],
    };

    it('should create household, connects creator, returns with users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        householdId: null,
      });
      prismaMock.household.findUnique.mockResolvedValue(null); // invite code unique
      prismaMock.household.create.mockResolvedValue(household);
      realtimeMock.syncUserHousehold.mockResolvedValue(undefined);

      const result = await service.createHousehold(userId, dto);

      expect(result).toEqual(household);
      const createCall = prismaMock.household.create.mock.calls[0][0];
      expect(createCall.data.name).toBe('Test Home');
      expect(createCall.data.users.connect).toEqual({ id: userId });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.createHousehold(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user already in a household', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, householdId: 99 });

      await expect(service.createHousehold(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate invite code and sync realtime', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        householdId: null,
      });
      prismaMock.household.findUnique.mockResolvedValue(null);
      prismaMock.household.create.mockResolvedValue(household);
      realtimeMock.syncUserHousehold.mockResolvedValue(undefined);

      await service.createHousehold(userId, dto);

      const createCall = prismaMock.household.create.mock.calls[0][0];
      expect(createCall.data.inviteCode).toMatch(/^[A-Z0-9]{8}$/);
      expect(realtimeMock.syncUserHousehold).toHaveBeenCalledWith(
        userId,
        10,
        null,
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.HOUSEHOLD_MEMBER_JOINED,
        { userId },
      );
    });
  });

  // ─── joinHousehold() ───────────────────────────────────────────────────────────

  describe('joinHousehold()', () => {
    const userId = 2;
    const dto = { inviteCode: 'ABC12345' };
    const household = {
      id: 10,
      name: 'Test Home',
      inviteCode: 'ABC12345',
      users: [{ id: 1, email: 'a@b.com', name: 'Alice' }],
    };

    it('should join household by valid invite code', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        householdId: null,
      });
      // $transaction callback receives the mock itself
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          household: { findUnique: jest.fn().mockResolvedValue(household) },
          user: {
            ...prismaMock.user,
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return await fn(tx);
      });
      prismaMock.household.findUnique.mockResolvedValue(household);
      realtimeMock.syncUserHousehold.mockResolvedValue(undefined);

      const result = await service.joinHousehold(userId, dto);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.joinHousehold(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if invite code invalid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        householdId: null,
      });
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          household: { findUnique: jest.fn().mockResolvedValue(null) },
        };
        return await fn(tx);
      });

      await expect(service.joinHousehold(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user already in a household', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 2, householdId: 99 });
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          household: {
            findUnique: jest
              .fn()
              .mockResolvedValueOnce(household) // find by inviteCode
              .mockResolvedValueOnce({ id: 99 }), // existing household check
          },
          user: { update: jest.fn().mockResolvedValue({}) },
        };
        return await fn(tx);
      });

      await expect(service.joinHousehold(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should sync user household room and emit HOUSEHOLD_MEMBER_JOINED', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        householdId: null,
      });
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          household: { findUnique: jest.fn().mockResolvedValue(household) },
          user: { update: jest.fn().mockResolvedValue({}) },
        };
        return await fn(tx);
      });
      realtimeMock.syncUserHousehold.mockResolvedValue(undefined);

      await service.joinHousehold(userId, dto);

      expect(realtimeMock.syncUserHousehold).toHaveBeenCalled();
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.HOUSEHOLD_MEMBER_JOINED,
        { userId },
      );
    });
  });

  // ─── getMyHousehold() ──────────────────────────────────────────────────────────

  describe('getMyHousehold()', () => {
    it('should return household with members', async () => {
      const household = {
        id: 10,
        name: 'Test Home',
        users: [{ id: 1, name: 'Alice' }],
      };
      prismaMock.user.findUnique.mockResolvedValue({ id: 1, householdId: 10 });
      prismaMock.household.findUnique.mockResolvedValue(household);

      const result = await service.getMyHousehold(1);

      expect(result).toEqual(household);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyHousehold(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user has no household', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        householdId: null,
      });

      await expect(service.getMyHousehold(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── ensureUserBelongsToHousehold() ────────────────────────────────────────────

  describe('ensureUserBelongsToHousehold()', () => {
    it('should pass if user belongs to household', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ householdId: 10 });

      await expect(
        service.ensureUserBelongsToHousehold(1, 10),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException if user not in household', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ householdId: 99 });

      await expect(service.ensureUserBelongsToHousehold(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── leaveHousehold() ──────────────────────────────────────────────────────────

  describe('leaveHousehold()', () => {
    const userId = 1;
    const householdId = 10;

    it('should leave household, unassign chores, sync realtime', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
            update: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(2), // remaining members
          },
          expense: {
            ...prismaMock.expense,
            aggregate: jest
              .fn()
              .mockResolvedValue({ _sum: { totalAmount: 1000 } }),
            findMany: jest.fn().mockResolvedValue([]),
          },
          expenseParticipant: {
            ...prismaMock.expenseParticipant,
            aggregate: jest
              .fn()
              .mockResolvedValue({ _sum: { shareAmount: 1000 } }),
          },
          payment: {
            ...prismaMock.payment,
            aggregate: jest
              .fn()
              .mockResolvedValueOnce({ _sum: { amount: 0 } }) // paymentsFrom
              .mockResolvedValueOnce({ _sum: { amount: 0 } }), // paymentsTo
          },
          chore: {
            ...prismaMock.chore,
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return await fn(tx);
      });
      realtimeMock.syncUserHousehold.mockResolvedValue(undefined);

      await service.leaveHousehold(userId);

      expect(realtimeMock.syncUserHousehold).toHaveBeenCalledWith(
        userId,
        null,
        householdId,
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.HOUSEHOLD_MEMBER_LEFT,
        { userId },
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return await fn(tx);
      });

      await expect(service.leaveHousehold(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user has no household', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest
              .fn()
              .mockResolvedValue({ id: 1, householdId: null }),
          },
        };
        return await fn(tx);
      });

      await expect(service.leaveHousehold(userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if outstanding balance (net ≠ 0)', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
            update: jest.fn().mockResolvedValue({}),
          },
          expense: {
            ...prismaMock.expense,
            aggregate: jest
              .fn()
              .mockResolvedValue({ _sum: { totalAmount: 3000 } }),
            findMany: jest.fn().mockResolvedValue([]),
          },
          expenseParticipant: {
            ...prismaMock.expenseParticipant,
            aggregate: jest
              .fn()
              .mockResolvedValue({ _sum: { shareAmount: 1000 } }),
          },
          payment: {
            ...prismaMock.payment,
            aggregate: jest
              .fn()
              .mockResolvedValueOnce({ _sum: { amount: 0 } })
              .mockResolvedValueOnce({ _sum: { amount: 0 } }),
          },
        };
        return await fn(tx);
      });

      await expect(service.leaveHousehold(userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete household if last member leaves (cascading deletes)', async () => {
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          ...prismaMock,
          user: {
            ...prismaMock.user,
            findUnique: jest.fn().mockResolvedValue({ id: 1, householdId: 10 }),
            update: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(0), // no remaining members
          },
          expense: {
            ...prismaMock.expense,
            aggregate: jest
              .fn()
              .mockResolvedValue({ _sum: { totalAmount: 1000 } }),
            findMany: jest.fn().mockResolvedValue([]),
          },
          expenseParticipant: {
            ...prismaMock.expenseParticipant,
            aggregate: jest
              .fn()
              .mockResolvedValue({ _sum: { shareAmount: 1000 } }),
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          chore: {
            ...prismaMock.chore,
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          householdNeed: {
            ...prismaMock.householdNeed,
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          payment: {
            ...prismaMock.payment,
            aggregate: jest
              .fn()
              .mockResolvedValueOnce({ _sum: { amount: 0 } })
              .mockResolvedValueOnce({ _sum: { amount: 0 } }),
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          notification: {
            ...prismaMock.notification,
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          household: {
            ...prismaMock.household,
            delete: jest.fn().mockResolvedValue({}),
          },
        };
        return await fn(tx);
      });
      realtimeMock.syncUserHousehold.mockResolvedValue(undefined);

      await service.leaveHousehold(userId);

      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.HOUSEHOLD_MEMBER_LEFT,
        { userId },
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.HOUSEHOLD_DELETED,
        { householdId },
      );
    });
  });
});
