import { PrismaService } from '../../prisma/prisma.service';

type ModelDelegate = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
  count: jest.Mock;
  createMany: jest.Mock;
};

type MockPrismaService = {
  [K in keyof PrismaService]: PrismaService[K] extends object
    ? ModelDelegate
    : PrismaService[K];
} & {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
};

const modelMethods = [
  'findUnique',
  'findFirst',
  'findMany',
  'create',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'aggregate',
  'groupBy',
  'count',
  'createMany',
] as const;

const modelNames = [
  'user',
  'household',
  'chore',
  'expense',
  'expenseParticipant',
  'householdNeed',
  'payment',
  'notification',
] as const;

function createModelDelegate(): ModelDelegate {
  const delegate = {} as ModelDelegate;
  for (const method of modelMethods) {
    delegate[method] = jest.fn();
  }
  return delegate;
}

export function createPrismaMock(): MockPrismaService {
  const mock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((fn: unknown) => {
      if (typeof fn === 'function') {
        return fn(mock);
      }
      return Promise.resolve([]);
    }),
  } as unknown as MockPrismaService;

  for (const model of modelNames) {
    (mock as Record<string, unknown>)[model] = createModelDelegate();
  }

  return mock;
}

export type { MockPrismaService, ModelDelegate };
