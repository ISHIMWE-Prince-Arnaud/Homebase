import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupE2E, teardownE2E, cleanupDatabase, prisma } from './setup.e2e';

describe('Chores (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let householdId: number;

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
        email: `chore${timestamp}@example.com`,
        password: 'Password123!',
        name: 'Chore User',
      });

    const cookies = registerRes.headers['set-cookie'];
    if (cookies && cookies[0]) {
      accessToken = cookies[0].split(';')[0].split('=')[1];
    }

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

  describe('CRUD flow', () => {
    it('should create chore → get chores → update → complete → delete', async () => {
      // Create chore
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const createRes = await request(app.getHttpServer())
        .post('/chores')
        .set('Cookie', `access_token=${accessToken}`)
        .send({ title: 'Clean kitchen', dueDate: futureDate })
        .expect(201);

      expect(createRes.body).toHaveProperty('id');
      expect(createRes.body.title).toBe('Clean kitchen');
      const choreId = createRes.body.id;

      // Get chores
      const getRes = await request(app.getHttpServer())
        .get('/chores')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].id).toBe(choreId);

      // Update chore
      await request(app.getHttpServer())
        .patch(`/chores/${choreId}`)
        .set('Cookie', `access_token=${accessToken}`)
        .send({ title: 'Clean kitchen thoroughly' })
        .expect(200);

      // Complete chore
      await request(app.getHttpServer())
        .patch(`/chores/${choreId}/complete`)
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      // Delete chore
      await request(app.getHttpServer())
        .delete(`/chores/${choreId}`)
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      // Verify deleted
      const getAfterDelete = await request(app.getHttpServer())
        .get('/chores')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(getAfterDelete.body).toHaveLength(0);
    });
  });
});
