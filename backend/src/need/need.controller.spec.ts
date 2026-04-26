import { Test, TestingModule } from '@nestjs/testing';
import { NeedController } from './need.controller';
import { NeedService } from './need.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

describe('NeedController', () => {
  let controller: NeedController;
  let needService: jest.Mocked<NeedService>;

  const mockNeed = {
    id: 1,
    name: 'Milk',
    quantity: '2',
    category: 'Groceries',
    isPurchased: false,
    householdId: 10,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    needService = {
      createNeed: jest.fn().mockResolvedValue(mockNeed),
      getNeeds: jest.fn().mockResolvedValue([mockNeed]),
      markPurchased: jest.fn().mockResolvedValue(mockNeed),
      updateNeed: jest.fn().mockResolvedValue(mockNeed),
      deleteNeed: jest.fn().mockResolvedValue(mockNeed),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NeedController],
      providers: [{ provide: NeedService, useValue: needService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NeedController>(NeedController);
  });

  describe('create()', () => {
    it('passes householdId + userId + dto to service', async () => {
      const dto = { name: 'Milk', quantity: '2', category: 'Groceries' };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.create(10, 1, dto as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(needService.createNeed).toHaveBeenCalledWith(10, 1, dto);
      expect(result).toEqual(mockNeed);
    });
  });

  describe('findAll()', () => {
    it('calls getNeeds with householdId', async () => {
      const result = await controller.findAll(10);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(needService.getNeeds).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockNeed]);
    });
  });

  describe('purchase()', () => {
    it('calls markPurchased with parsed id, householdId, userId, and dto', async () => {
      const dto = { createExpense: false };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.purchase(10, 1, '1', dto as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(needService.markPurchased).toHaveBeenCalledWith(1, 10, 1, dto);
      expect(result).toEqual(mockNeed);
    });
  });

  describe('update()', () => {
    it('calls updateNeed with parsed id, householdId, and dto', async () => {
      const dto = { name: 'Updated Milk' };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.update(10, '1', dto as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(needService.updateNeed).toHaveBeenCalledWith(1, 10, dto);
      expect(result).toEqual(mockNeed);
    });
  });

  describe('remove()', () => {
    it('calls deleteNeed with parsed id and householdId', async () => {
      const result = await controller.remove(10, '1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(needService.deleteNeed).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockNeed);
    });
  });
});
