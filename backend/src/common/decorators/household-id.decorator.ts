import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const householdIdFactory = (_data: unknown, ctx: ExecutionContext): number => {
  const req = ctx
    .switchToHttp()
    .getRequest<{ user?: { householdId?: number } }>();
  const id = req.user?.householdId;
  if (typeof id !== 'number') {
    throw new BadRequestException('householdId is missing');
  }
  return id;
};

export const HouseholdId = createParamDecorator(householdIdFactory);
