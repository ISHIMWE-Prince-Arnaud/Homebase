import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupE2E, teardownE2E, cleanupDatabase, prisma } from './setup.e2e';

describe('Needs (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let householdId: number;
  let userId: number;

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
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `need${timestamp}@example.com`,
        password: 'Password123!',
        name: 'Need User',
      });

    const cookies = registerRes.headers['set-cookie'];
    if (cookies && cookies[0]) {
      accessToken = cookies[0].split(';')[0].split('=')[1];
    }
    userId = registerRes.body.user.id;

    // Create household
    const householdRes = await request(app.getHttpServer())
      .post('/households')
      .set('Cookie', `access_token=${accessToken}`)
      .send({ name: 'Test Household' });

    householdId = householdRes.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Need flow', () => {
    it('should create need → update → mark purchased → delete', async () => {
      // Create need
      const createRes = await request(app.getHttpServer())
        .post('/needs')
        .set('Cookie', `access_token=${accessToken}`)
        .send({
          name: 'Milk',
          quantity: '2',
          category: 'Groceries',
        })
        .expect(201);

      expect(createRes.body).toHaveProperty('id');
      expect(createRes.body.name).toBe('Milk');
      const needId = createRes.body.id;

      // Update need
      await request(app.getHttpServer())
        .patch(`/needs/${needId}`)
        .set('Cookie', `access_token=${accessToken}`)
        .send({ name: 'Almond Milk' })
        .expect(200);

      // Mark purchased
      await request(app.getHttpServer())
        .patch(`/needs/${needId}/purchase`)
        .set('Cookie', `access_token=${accessToken}`)
        .send({ createExpense: false })
        .expect(200);

      // Delete need
      await request(app.getHttpServer())
        .delete(`/needs/${needId}`)
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      // Verify deleted
      const getRes = await request(app.getHttpServer())
        .get('/needs')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(getRes.body).toHaveLength(0);
    });
  });
});
