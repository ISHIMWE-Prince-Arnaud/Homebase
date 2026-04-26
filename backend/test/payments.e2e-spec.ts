import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupE2E, teardownE2E, cleanupDatabase } from './setup.e2e';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let accessToken2: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let householdId: number;

  let userId: number;

  let userId2: number;

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

    // Register first user
    const timestamp = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `payer${timestamp}@example.com`,
        password: 'Password123!',
        name: 'Payer User',
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

    // Register second user
    const timestamp2 = Date.now() + 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const registerRes2 = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `receiver${timestamp2}@example.com`,
        password: 'Password123!',
        name: 'Receiver User',
      });

    const cookies2 = registerRes2.headers['set-cookie'];
    if (cookies2 && cookies2[0]) {
      accessToken2 = cookies2[0].split(';')[0].split('=')[1];
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    userId2 = registerRes2.body.user.id;

    // Join household
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/households/join')
      .set('Cookie', `access_token=${accessToken2}`)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      .send({ inviteCode: householdRes.body.inviteCode });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Payment flow', () => {
    it('should create expense → create payment to settle debt → get payments', async () => {
      // Create expense where user2 owes user1
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/expenses')
        .set('Cookie', `access_token=${accessToken}`)
        .send({
          description: 'Groceries',
          totalAmount: 100,
          paidById: userId,
          participants: [userId, userId2],
        })
        .expect(201);

      // Create payment to settle debt
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const paymentRes = await request(app.getHttpServer())
        .post('/payments')
        .set('Cookie', `access_token=${accessToken2}`)
        .send({
          toUserId: userId,
          amount: 50,
        })
        .expect(201);

      expect(paymentRes.body).toHaveProperty('payment');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(paymentRes.body.payment.amount).toBe(50);
      expect(paymentRes.body).toHaveProperty('remainingDirectDebt');

      // Get payments
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const getRes = await request(app.getHttpServer())
        .get('/payments')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(getRes.body).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(getRes.body[0].amount).toBe(50);
    });
  });
});
