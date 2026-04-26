import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupE2E, teardownE2E, cleanupDatabase, prisma } from './setup.e2e';

describe('Household (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userEmail: string;

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

    // Register and login to get token
    const timestamp = Date.now();
    userEmail = `household${timestamp}@example.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: userEmail,
        password: 'Password123!',
        name: 'Household User',
      });

    const cookies = registerRes.headers['set-cookie'];
    if (cookies && cookies[0]) {
      accessToken = cookies[0].split(';')[0].split('=')[1];
    }
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Full household flow', () => {
    it('should register → create household → get household → join with invite code', async () => {
      // Create household
      const createRes = await request(app.getHttpServer())
        .post('/households')
        .set('Cookie', `access_token=${accessToken}`)
        .send({ name: 'Test Household' })
        .expect(201);

      expect(createRes.body).toHaveProperty('id');
      expect(createRes.body).toHaveProperty('inviteCode');
      const inviteCode = createRes.body.inviteCode;

      // Get my household
      const getRes = await request(app.getHttpServer())
        .get('/households/me')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(getRes.body.id).toBe(createRes.body.id);
      expect(getRes.body.name).toBe('Test Household');

      // Register second user
      const timestamp2 = Date.now() + 1;
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

      // Join household with invite code
      const joinRes = await request(app.getHttpServer())
        .post('/households/join')
        .set('Cookie', `access_token=${accessToken2}`)
        .send({ inviteCode })
        .expect(200);

      expect(joinRes.body.id).toBe(createRes.body.id);
    });
  });

  describe('Leave household flow', () => {
    it('should create household → leave household', async () => {
      // Create household
      const createRes = await request(app.getHttpServer())
        .post('/households')
        .set('Cookie', `access_token=${accessToken}`)
        .send({ name: 'Test Household' })
        .expect(201);

      // Leave household
      await request(app.getHttpServer())
        .post('/households/leave')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      // Verify user has no household
      const getRes = await request(app.getHttpServer())
        .get('/households/me')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(404);
    });
  });
});
