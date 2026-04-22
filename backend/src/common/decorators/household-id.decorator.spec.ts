import { BadRequestException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { householdIdFactory } from './household-id.decorator';

describe('HouseholdId decorator', () => {
  it('returns user.householdId from request when present', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { householdId: 10 } }),
      }),
    } as unknown as ExecutionContext;

    const result = householdIdFactory(null, mockCtx);

    expect(result).toBe(10);
  });

  it('throws BadRequestException when user.householdId is undefined', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: {} }),
      }),
    } as unknown as ExecutionContext;

    expect(() => householdIdFactory(null, mockCtx)).toThrow(BadRequestException);
    expect(() => householdIdFactory(null, mockCtx)).toThrow('householdId is missing');
  });

  it('throws BadRequestException when user is undefined', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(() => householdIdFactory(null, mockCtx)).toThrow(BadRequestException);
    expect(() => householdIdFactory(null, mockCtx)).toThrow('householdId is missing');
  });

  it('throws BadRequestException when user.householdId is not a number', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { householdId: '10' as any } }),
      }),
    } as unknown as ExecutionContext;

    expect(() => householdIdFactory(null, mockCtx)).toThrow(BadRequestException);
    expect(() => householdIdFactory(null, mockCtx)).toThrow('householdId is missing');
  });
});
