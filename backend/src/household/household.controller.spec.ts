import { Test, TestingModule } from '@nestjs/testing';
import { HouseholdController } from './household.controller';
import { HouseholdService } from './household.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

describe('HouseholdController', () => {
  let controller: HouseholdController;
  let householdService: jest.Mocked<HouseholdService>;

  const mockHousehold = {
    id: 10,
    name: 'Test Household',
    inviteCode: 'ABC123',
    users: [{ id: 1, name: 'Alice', email: 'a@b.com' }],
  };

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    householdService = {
      createHousehold: jest.fn().mockResolvedValue(mockHousehold),
      joinHousehold: jest.fn().mockResolvedValue(mockHousehold),
      leaveHousehold: jest.fn().mockResolvedValue(undefined),
      getMyHousehold: jest.fn().mockResolvedValue(mockHousehold),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HouseholdController],
      providers: [{ provide: HouseholdService, useValue: householdService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<HouseholdController>(HouseholdController);
  });

  describe('create()', () => {
    it('extracts userId from req.user and calls service', async () => {
      const dto = { name: 'Test Household' };
      const mockReq = { user: { id: 1 } };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.create(mockReq as any, dto as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(householdService.createHousehold).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockHousehold);
    });
  });

  describe('join()', () => {
    it('passes userId and dto to service', async () => {
      const dto = { inviteCode: 'ABC123' };
      const mockReq = { user: { id: 1 } };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.join(mockReq as any, dto as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(householdService.joinHousehold).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockHousehold);
    });
  });

  describe('leave()', () => {
    it('calls leaveHousehold with userId from req.user', async () => {
      const mockReq = { user: { id: 1 } };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await controller.leave(mockReq as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(householdService.leaveHousehold).toHaveBeenCalledWith(1);
    });
  });

  describe('getMyHousehold()', () => {
    it('calls getMyHousehold with userId from req.user', async () => {
      const mockReq = { user: { id: 1 } };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.getMyHousehold(mockReq as any);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(householdService.getMyHousehold).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockHousehold);
    });
  });
});
