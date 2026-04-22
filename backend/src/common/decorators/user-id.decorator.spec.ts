import { BadRequestException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { userIdFactory } from './user-id.decorator';

describe('UserId decorator', () => {
  it('returns user.id from request when present', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 123 } }),
      }),
    } as unknown as ExecutionContext;

    const result = userIdFactory(null, mockCtx);

    expect(result).toBe(123);
  });

  it('throws BadRequestException when user.id is undefined', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: {} }),
      }),
    } as unknown as ExecutionContext;

    expect(() => userIdFactory(null, mockCtx)).toThrow(BadRequestException);
    expect(() => userIdFactory(null, mockCtx)).toThrow('user id is missing');
  });

  it('throws BadRequestException when user is undefined', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(() => userIdFactory(null, mockCtx)).toThrow(BadRequestException);
    expect(() => userIdFactory(null, mockCtx)).toThrow('user id is missing');
  });

  it('throws BadRequestException when user.id is not a number', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: '123' as any } }),
      }),
    } as unknown as ExecutionContext;

    expect(() => userIdFactory(null, mockCtx)).toThrow(BadRequestException);
    expect(() => userIdFactory(null, mockCtx)).toThrow('user id is missing');
  });
});
