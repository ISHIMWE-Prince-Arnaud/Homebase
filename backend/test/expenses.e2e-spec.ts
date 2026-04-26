import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupE2E, teardownE2E, cleanupDatabase } from './setup.e2e';

describe('Expenses (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let householdId: number;

  let userId: number;

  let inviteCode: string;

  beforeAll(async () => {
    await setupE2E();
  });

  afterAll(async () => {
    await teardownE2E();
  });

  beforeEach(async () => {
    await cleanupDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register and login
    const timestamp = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `expense${timestamp}@example.com`,
        password: 'Password123!',
        name: 'Expense User',
      });

    const cookies = registerRes.headers['set-cookie'];
    if (cookies && cookies[0]) {
      accessToken = cookies[0].split(';')[0].split('=')[1];
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    userId = registerRes.body.user.id;

    // Create household

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const householdRes = await request(app.getHttpServer())
      .post('/households')
      .set('Cookie', `access_token=${accessToken}`)
      .send({ name: 'Test Household' });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    householdId = householdRes.body.id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    inviteCode = householdRes.body.inviteCode;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Expense flow', () => {
    it('should create expense → get expenses → get balance → get settlements', async () => {
      // Register second user for splitting
      const timestamp2 = Date.now() + 1;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const registerRes2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `member2${timestamp2}@example.com`,
          password: 'Password123!',
          name: 'Member 2',
        });

      const cookies2 = registerRes2.headers['set-cookie'];
      const accessToken2 =
        cookies2 && cookies2[0] ? cookies2[0].split(';')[0].split('=')[1] : '';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const userId2 = registerRes2.body.user.id;

      // Join household
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/households/join')
        .set('Cookie', `access_token=${accessToken2}`)
        .send({ inviteCode });

      // Create expense
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const createRes = await request(app.getHttpServer())
        .post('/expenses')
        .set('Cookie', `access_token=${accessToken}`)
        .send({
          description: 'Groceries',
          totalAmount: 100,
          paidById: userId,
          participants: [userId, userId2],
        })
        .expect(201);

      expect(createRes.body).toHaveProperty('id');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createRes.body.description).toBe('Groceries');

      // Get expenses
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const getRes = await request(app.getHttpServer())
        .get('/expenses')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(getRes.body).toHaveLength(1);

      // Get balance
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const balanceRes = await request(app.getHttpServer())
        .get('/expenses/balance')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(balanceRes.body).toHaveLength(2);

      // Get settlements
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const settlementsRes = await request(app.getHttpServer())
        .get('/expenses/settlements')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(settlementsRes.body).toHaveProperty('settlements');
    });
  });
});
