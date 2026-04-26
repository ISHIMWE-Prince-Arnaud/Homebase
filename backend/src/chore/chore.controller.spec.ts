import { Test, TestingModule } from '@nestjs/testing';
import { ChoreController } from './chore.controller';
import { ChoreService } from './chore.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

describe('ChoreController', () => {
  let controller: ChoreController;
  let choreService: jest.Mocked<ChoreService>;

  const mockChore = {
    id: 1,
    title: 'Clean kitchen',
    description: 'Wash dishes',
    dueDate: new Date('2025-12-31'),
    isComplete: false,
    assignedToId: 1,
    householdId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    choreService = {
      getChoresByHousehold: jest.fn().mockResolvedValue([mockChore]),
      createChore: jest.fn().mockResolvedValue(mockChore),
      markComplete: jest.fn().mockResolvedValue(mockChore),
      deleteChore: jest.fn().mockResolvedValue(mockChore),
      getChoreById: jest.fn().mockResolvedValue(mockChore),
      updateChore: jest.fn().mockResolvedValue(mockChore),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChoreController],
      providers: [{ provide: ChoreService, useValue: choreService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChoreController>(ChoreController);
  });

  describe('getAll()', () => {
    it('uses HouseholdId decorator and calls service', async () => {
      const result = await controller.getAll(10);

      expect(choreService.getChoresByHousehold).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockChore]);
    });
  });

  describe('create()', () => {
    it('uses HouseholdId decorator and calls service with dto', async () => {
      const dto = { title: 'Clean kitchen', dueDate: '2025-12-31' };

      const result = await controller.create(10, 1, dto as any);

      expect(choreService.createChore).toHaveBeenCalledWith(10, 1, dto);
      expect(result).toEqual(mockChore);
    });
  });

  describe('complete()', () => {
    it('calls markComplete with parsed id and householdId', async () => {
      const result = await controller.complete(10, '1');

      expect(choreService.markComplete).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockChore);
    });
  });

  describe('remove()', () => {
    it('calls deleteChore with parsed id and householdId', async () => {
      const result = await controller.remove(10, '1');

      expect(choreService.deleteChore).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockChore);
    });
  });

  describe('getOne()', () => {
    it('calls getChoreById with parsed id and householdId', async () => {
      const result = await controller.getOne(10, '1');

      expect(choreService.getChoreById).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockChore);
    });
  });

  describe('update()', () => {
    it('calls updateChore with parsed id, householdId, and dto', async () => {
      const dto = { title: 'Updated title' };

      const result = await controller.update(10, 1, '1', dto as any);

      expect(choreService.updateChore).toHaveBeenCalledWith(1, 10, 1, dto);
      expect(result).toEqual(mockChore);
    });
  });
});
