import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChoreService } from './chore.service';
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

describe('ChoreService', () => {
  let service: ChoreService;
  let prismaMock: MockPrismaService;
  let realtimeMock: MockRealtimeService;
  let notificationMock: MockNotificationService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    realtimeMock = createRealtimeMock();
    notificationMock = createNotificationMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChoreService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RealtimeService, useValue: realtimeMock },
        { provide: NotificationService, useValue: notificationMock },
      ],
    }).compile();

    service = module.get<ChoreService>(ChoreService);
  });

  // ─── getChoresByHousehold() ────────────────────────────────────────────────────

  describe('getChoresByHousehold()', () => {
    it('should return chores for a household with assignedTo included', async () => {
      const chores = [
        {
          id: 1,
          title: 'Dishes',
          householdId: 10,
          assignedTo: { id: 1, name: 'Alice' },
        },
      ];
      prismaMock.chore.findMany.mockResolvedValue(chores);

      const result = await service.getChoresByHousehold(10);

      expect(result).toEqual(chores);
      expect(prismaMock.chore.findMany).toHaveBeenCalledWith({
        where: { householdId: 10 },
        include: { assignedTo: true },
      });
    });
  });

  // ─── createChore() ─────────────────────────────────────────────────────────────

  describe('createChore()', () => {
    const householdId = 10;
    const createdChore = {
      id: 1,
      title: 'Dishes',
      householdId: 10,
      assignedTo: null,
    };

    it('should create chore without assignment', async () => {
      prismaMock.chore.create.mockResolvedValue(createdChore);

      const result = await service.createChore(householdId, 1, {
        title: 'Dishes',
      });

      expect(result).toEqual(createdChore);
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.CHORE_CREATED,
        { chore: createdChore },
      );
    });

    it('should create chore with valid assignedToId in same household', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 5, householdId: 10 });
      prismaMock.chore.create.mockResolvedValue({
        ...createdChore,
        assignedTo: { id: 5 },
      });

      const result = await service.createChore(householdId, 1, {
        title: 'Dishes',
        assignedToId: 5,
      });

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if assigned user not in same household', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 5, householdId: 99 });

      await expect(
        service.createChore(householdId, 1, {
          title: 'Dishes',
          assignedToId: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit CHORE_CREATED realtime event', async () => {
      prismaMock.chore.create.mockResolvedValue(createdChore);

      await service.createChore(householdId, 1, { title: 'Dishes' });

      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        householdId,
        RealtimeEvents.CHORE_CREATED,
        expect.any(Object),
      );
    });
  });

  // ─── markComplete() ────────────────────────────────────────────────────────────

  describe('markComplete()', () => {
    it('should mark chore as complete, emits CHORE_COMPLETED', async () => {
      prismaMock.chore.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markComplete(1, 10);

      expect(result.count).toBe(1);
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.CHORE_COMPLETED,
        { choreId: 1 },
      );
    });

    it('should throw NotFoundException if chore not found', async () => {
      prismaMock.chore.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.markComplete(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── deleteChore() ──────────────────────────────────────────────────────────────

  describe('deleteChore()', () => {
    it('should delete chore, emits CHORE_DELETED', async () => {
      prismaMock.chore.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteChore(1, 10);

      expect(result.count).toBe(1);
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.CHORE_DELETED,
        { choreId: 1 },
      );
    });

    it('should throw NotFoundException if chore not found', async () => {
      prismaMock.chore.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteChore(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getChoreById() ────────────────────────────────────────────────────────────

  describe('getChoreById()', () => {
    it('should return chore with assignedTo', async () => {
      const chore = {
        id: 1,
        title: 'Dishes',
        assignedTo: { id: 5, name: 'Alice' },
      };
      prismaMock.chore.findFirst.mockResolvedValue(chore);

      const result = await service.getChoreById(1, 10);

      expect(result).toEqual(chore);
    });

    it('should throw NotFoundException if not found', async () => {
      prismaMock.chore.findFirst.mockResolvedValue(null);

      await expect(service.getChoreById(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── updateChore() ─────────────────────────────────────────────────────────────

  describe('updateChore()', () => {
    it('should update title/description', async () => {
      prismaMock.chore.findFirst.mockResolvedValue({ id: 1 });
      const updated = { id: 1, title: 'New Title', assignedTo: null };
      prismaMock.chore.update.mockResolvedValue(updated);

      const result = await service.updateChore(1, 10, 1, {
        title: 'New Title',
        description: 'Desc',
      });

      expect(result.title).toBe('New Title');
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.CHORE_UPDATED,
        expect.any(Object),
      );
    });

    it('should update isComplete to true, emits both CHORE_UPDATED and CHORE_COMPLETED', async () => {
      prismaMock.chore.findFirst.mockResolvedValue({ id: 1 });
      prismaMock.chore.update.mockResolvedValue({
        id: 1,
        isComplete: true,
        assignedTo: null,
      });

      await service.updateChore(1, 10, 1, { isComplete: true });

      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.CHORE_UPDATED,
        expect.any(Object),
      );
      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.CHORE_COMPLETED,
        { choreId: 1 },
      );
    });

    it('should update assignedToId, emits CHORE_ASSIGNED', async () => {
      prismaMock.chore.findFirst.mockResolvedValue({ id: 1 });
      prismaMock.user.findUnique.mockResolvedValue({ id: 5, householdId: 10 });
      prismaMock.chore.update.mockResolvedValue({
        id: 1,
        assignedTo: { id: 5 },
      });

      await service.updateChore(1, 10, 1, { assignedToId: 5 });

      expect(realtimeMock.emitToHousehold).toHaveBeenCalledWith(
        10,
        RealtimeEvents.CHORE_ASSIGNED,
        { choreId: 1, assignedToId: 5 },
      );
    });

    it('should disconnect assignment when assignedToId is null', async () => {
      prismaMock.chore.findFirst.mockResolvedValue({ id: 1 });
      prismaMock.chore.update.mockResolvedValue({ id: 1, assignedTo: null });

      await service.updateChore(1, 10, 1, { assignedToId: null });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const updateCall = prismaMock.chore.update.mock.calls[0][0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(updateCall.data.assignedTo).toEqual({ disconnect: true });
    });

    it('should throw NotFoundException if chore not found', async () => {
      prismaMock.chore.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChore(999, 10, 1, { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if dueDate is in the past', async () => {
      prismaMock.chore.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.updateChore(1, 10, 1, { dueDate: '2020-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if assigned user not in same household', async () => {
      prismaMock.chore.findFirst.mockResolvedValue({ id: 1 });
      prismaMock.user.findUnique.mockResolvedValue({ id: 5, householdId: 99 });

      await expect(
        service.updateChore(1, 10, 1, { assignedToId: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
