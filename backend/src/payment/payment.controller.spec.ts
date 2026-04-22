import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;

  const mockPayment = {
    id: 1,
    fromUserId: 2,
    toUserId: 1,
    amount: 500,
    householdId: 10,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    paymentService = {
      createPayment: jest.fn().mockResolvedValue({ payment: mockPayment, remainingDirectDebt: 500 }),
      getPayments: jest.fn().mockResolvedValue([mockPayment]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: paymentService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  describe('create()', () => {
    it('passes householdId + userId + dto to service', async () => {
      const dto = { toUserId: 1, amount: 500 };

      const result = await controller.create(10, 2, dto as any);

      expect(paymentService.createPayment).toHaveBeenCalledWith(10, 2, dto);
      expect(result).toEqual({ payment: mockPayment, remainingDirectDebt: 500 });
    });
  });

  describe('list()', () => {
    it('calls getPayments with householdId', async () => {
      const result = await controller.list(10);

      expect(paymentService.getPayments).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockPayment]);
    });
  });
});
