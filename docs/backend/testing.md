# Backend Testing Guide

Comprehensive guide for testing the Homebase NestJS backend.

## Test Stack Overview

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner and assertion library |
| **@nestjs/testing** | NestJS testing utilities |
| **supertest** | HTTP assertion library for E2E tests |
| **ts-jest** | TypeScript transformation for Jest |

## Test Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts      # Unit test (co-located)
│   │   └── auth.controller.ts
│   │   └── auth.controller.spec.ts    # Unit test (co-located)
│   └── ...
└── test/
    ├── app.e2e-spec.ts                # E2E tests
    └── jest-e2e.json                  # E2E Jest config
```

## Unit Testing

### Testing Services

#### Basic Service Test Structure

```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  // Mock factories for clean test setup
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return user data', async () => {
      // Arrange
      const dto = { email: 'test@test.com', password: 'password123', name: 'Test' };
      const createdUser = { id: 1, email: dto.email, name: dto.name };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.register(dto);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          password: expect.any(String), // hashed
          name: dto.name,
        },
      });
    });

    it('should throw if email already exists', async () => {
      // Arrange
      const dto = { email: 'exists@test.com', password: 'password', name: 'Test' };
      mockPrismaService.user.create.mockRejectedValue({
        code: 'P2002', // Prisma unique constraint error
      });

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow();
    });
  });
});
```

#### Testing with Prisma

```typescript
// Testing queries with includes
describe('findHouseholdWithMembers', () => {
  it('should return household with user array', async () => {
    const mockHousehold = {
      id: 1,
      name: 'Test House',
      users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
    };

    mockPrismaService.household.findUnique.mockResolvedValue(mockHousehold);

    const result = await service.findHouseholdWithMembers(1);

    expect(result.users).toHaveLength(2);
    expect(mockPrismaService.household.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { users: true },
    });
  });
});
```

### Testing Controllers

#### Controller Test Pattern

```typescript
// src/chore/chore.controller.spec.ts
import { Test } from '@nestjs/testing';
import { ChoreController } from './chore.controller';
import { ChoreService } from './chore.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CreateChoreDto } from './dto/create-chore.dto';

describe('ChoreController', () => {
  let controller: ChoreController;
  let service: ChoreService;

  const mockChoreService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    complete: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ChoreController],
      providers: [
        { provide: ChoreService, useValue: mockChoreService },
      ],
    })
      .overrideGuard(JwtGuard) // Mock the guard
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChoreController>(ChoreController);
    service = module.get<ChoreService>(ChoreService);
  });

  describe('create', () => {
    it('should create a chore', async () => {
      const dto: CreateChoreDto = {
        title: 'Clean kitchen',
        description: 'Wash dishes',
        dueDate: new Date(),
      };
      const userId = 1;
      const householdId = 1;

      const expectedResult = {
        id: 1,
        ...dto,
        householdId,
        isComplete: false,
      };

      mockChoreService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto, userId, householdId);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(dto, householdId, userId);
    });
  });
});
```

### Testing Guards

```typescript
// Testing custom guards
describe('JwtGuard', () => {
  let guard: JwtGuard;
  let jwtService: JwtService;

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        cookies: { access_token: 'valid-token' },
      }),
    }),
  };

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
    guard = new JwtGuard(jwtService);
  });

  it('should allow access with valid token', async () => {
    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 1, email: 'test@test.com' });

    const result = await guard.canActivate(mockExecutionContext as any);

    expect(result).toBe(true);
  });

  it('should deny access with invalid token', async () => {
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await expect(guard.canActivate(mockExecutionContext as any)).rejects.toThrow();
  });
});
```

## E2E Testing

### E2E Test Setup

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.payment.deleteMany();
    await prisma.expenseParticipant.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.chore.deleteMany();
    await prisma.householdNeed.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    await prisma.household.deleteMany();
  });

  describe('/auth (e2e)', () => {
    it('/auth/register (POST) - should create user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@test.com');
      expect(response.headers['set-cookie']).toBeDefined(); // JWT cookie set
    });

    it('/auth/login (POST) - should authenticate user', async () => {
      // First register
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
        });

      // Then login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
    });
  });
});
```

### Testing with Authentication

```typescript
// Helper to get authenticated request agent
describe('Protected Routes (e2e)', () => {
  let authCookies: string[];

  beforeEach(async () => {
    // Register and get cookies
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });

    authCookies = response.headers['set-cookie'];
  });

  it('/households (POST) - should create household', async () => {
    const response = await request(app.getHttpServer())
      .post('/households')
      .set('Cookie', authCookies)
      .send({ name: 'Test Household' })
      .expect(201);

    expect(response.body.name).toBe('Test Household');
    expect(response.body.inviteCode).toBeDefined();
  });

  it('/chores (GET) - should require household', async () => {
    await request(app.getHttpServer())
      .get('/chores')
      .set('Cookie', authCookies)
      .expect(403); // No household yet
  });
});
```

### Full User Flow E2E Test

```typescript
describe('Complete User Flow (e2e)', () => {
  it('should complete full household workflow', async () => {
    // 1. Register
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'alice@test.com', password: 'password', name: 'Alice' })
      .expect(201);

    const cookies = registerRes.headers['set-cookie'];

    // 2. Create household
    const householdRes = await request(app.getHttpServer())
      .post('/households')
      .set('Cookie', cookies)
      .send({ name: 'Alice House' })
      .expect(201);

    const householdId = householdRes.body.id;

    // 3. Create chore
    const choreRes = await request(app.getHttpServer())
      .post('/chores')
      .set('Cookie', cookies)
      .send({
        title: 'Clean room',
        description: 'Vacuum and dust',
        dueDate: new Date().toISOString(),
      })
      .expect(201);

    expect(choreRes.body.title).toBe('Clean room');

    // 4. Mark chore complete
    await request(app.getHttpServer())
      .patch(`/chores/${choreRes.body.id}/complete`)
      .set('Cookie', cookies)
      .expect(200);

    // 5. Create expense
    const expenseRes = await request(app.getHttpServer())
      .post('/expenses')
      .set('Cookie', cookies)
      .send({
        description: 'Groceries',
        totalAmount: 100,
        date: new Date().toISOString(),
        participants: [{ userId: registerRes.body.user.id, shareAmount: 100 }],
      })
      .expect(201);

    expect(expenseRes.body.totalAmount).toBe(100);
  });
});
```

## Test Data Factories

### User Factory

```typescript
// test/factories/user.factory.ts
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

export class UserFactory {
  static async create(prisma: PrismaService, overrides = {}) {
    const defaultData = {
      email: `user${Date.now()}@test.com`,
      password: await bcrypt.hash('password123', 10),
      name: 'Test User',
    };

    return prisma.user.create({
      data: { ...defaultData, ...overrides },
    });
  }

  static async createMany(prisma: PrismaService, count: number, overrides = {}) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(prisma, overrides));
    }
    return users;
  }
}
```

### Household Factory

```typescript
// test/factories/household.factory.ts
export class HouseholdFactory {
  static async create(prisma: PrismaService, creatorId: number, overrides = {}) {
    const defaultData = {
      name: 'Test Household',
      inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
    };

    const household = await prisma.household.create({
      data: { ...defaultData, ...overrides },
    });

    // Add creator as member
    await prisma.user.update({
      where: { id: creatorId },
      data: { householdId: household.id },
    });

    return household;
  }
}
```

### Expense Factory

```typescript
// test/factories/expense.factory.ts
export class ExpenseFactory {
  static async create(
    prisma: PrismaService,
    householdId: number,
    paidById: number,
    participants: { userId: number; shareAmount: number }[],
    overrides = {}
  ) {
    const totalAmount = participants.reduce((sum, p) => sum + p.shareAmount, 0);

    const defaultData = {
      description: 'Test Expense',
      totalAmount,
      date: new Date(),
    };

    const expense = await prisma.expense.create({
      data: {
        ...defaultData,
        ...overrides,
        householdId,
        paidById,
        participants: {
          create: participants,
        },
      },
      include: { participants: true },
    });

    return expense;
  }
}
```

## Test Configuration

### Jest Config (Unit Tests)

```json
// package.json (existing config)
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/$1"
    }
  }
}
```

### Jest Config (E2E Tests)

```json
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/../src/$1"
  }
}
```

## Coverage Requirements

### Recommended Coverage Thresholds

```json
// jest.config.js or package.json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Critical Paths to Cover

| Component | Priority | Reason |
|-----------|----------|--------|
| AuthService | Critical | Security sensitive |
| ExpenseService | Critical | Financial calculations |
| PaymentService | Critical | Settlement logic |
| Guards | High | Authorization enforcement |
| Controllers | Medium | API contract validation |
| DTOs | Medium | Input validation |

## Running Tests

```bash
cd backend

# Run all unit tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Debug mode
npm run test:debug
```

## Best Practices

1. **Test behavior, not implementation** - Don't test private methods
2. **One assertion per test** - Keep tests focused and readable
3. **Use factories for test data** - Consistent, valid test objects
4. **Clean database between tests** - Prevent test interference
5. **Mock external services** - Database, JWT, external APIs
6. **Test edge cases** - Empty arrays, null values, invalid inputs
7. **Name tests descriptively** - `should throw when email exists`
8. **Group related tests** - Use `describe` blocks for organization

## Common Testing Patterns

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  mockService.method.mockResolvedValue(expectedResult);
  
  const result = await controller.action();
  
  expect(result).toEqual(expectedResult);
});
```

### Testing Exceptions

```typescript
it('should throw NotFoundException', async () => {
  mockService.findOne.mockResolvedValue(null);
  
  await expect(controller.findOne(1)).rejects.toThrow(NotFoundException);
});
```

### Testing with Time

```typescript
it('should filter by date', async () => {
  const now = new Date('2024-01-15');
  jest.useFakeTimers().setSystemTime(now);
  
  // Test with fixed time
  
  jest.useRealTimers();
});
```

## Further Reading

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
