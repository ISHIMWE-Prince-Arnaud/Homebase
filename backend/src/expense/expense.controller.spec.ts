import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

describe('ExpenseController', () => {
  let controller: ExpenseController;
  let expenseService: jest.Mocked<ExpenseService>;

  const mockExpense = {
    id: 1,
    title: 'Groceries',
    totalAmount: 100,
    paidById: 1,
    householdId: 10,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    expenseService = {
      createExpense: jest.fn().mockResolvedValue(mockExpense),
      getExpenses: jest.fn().mockResolvedValue([mockExpense]),
      getBalance: jest.fn().mockResolvedValue([{ userId: 1, net: 50 }]),
      getSettlements: jest.fn().mockResolvedValue({ settlements: [] }),
      getMySettlements: jest.fn().mockResolvedValue({ settlements: [] }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [{ provide: ExpenseService, useValue: expenseService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ExpenseController>(ExpenseController);
  });

  describe('create()', () => {
    it('passes householdId + userId + dto to service', async () => {
      const dto = {
        title: 'Groceries',
        totalAmount: 100,
        paidById: 1,
        participants: [{ userId: 1 }, { userId: 2 }],
      };

      const result = await controller.create(10, 1, dto as any);

      expect(expenseService.createExpense).toHaveBeenCalledWith(10, 1, dto);
      expect(result).toEqual(mockExpense);
    });
  });

  describe('findAll()', () => {
    it('calls getExpenses with householdId', async () => {
      const result = await controller.findAll(10);

      expect(expenseService.getExpenses).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockExpense]);
    });
  });

  describe('balance()', () => {
    it('calls getBalance with householdId', async () => {
      const result = await controller.balance(10);

      expect(expenseService.getBalance).toHaveBeenCalledWith(10);
      expect(result).toEqual([{ userId: 1, net: 50 }]);
    });
  });

  describe('settlements()', () => {
    it('calls getSettlements with householdId', async () => {
      const result = await controller.settlements(10);

      expect(expenseService.getSettlements).toHaveBeenCalledWith(10);
      expect(result).toEqual({ settlements: [] });
    });
  });

  describe('mySettlements()', () => {
    it('calls getMySettlements with householdId and userId', async () => {
      const result = await controller.mySettlements(10, 1);

      expect(expenseService.getMySettlements).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual({ settlements: [] });
    });
  });
});
