import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupE2E, teardownE2E, cleanupDatabase } from './setup.e2e';

describe('Auth (e2e)', () => {
  let app: INestApplication;

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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user, set cookie, and return user', async () => {
      const timestamp = Date.now();
      const registerDto = {
        email: `test${timestamp}@example.com`,
        password: 'Password123!',
        name: 'Test User',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.user.email).toBe(registerDto.email);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.user.name).toBe(registerDto.name);
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies && cookies[0]).toContain('access_token');
    });

    it('should return 409 if email already exists', async () => {
      const timestamp = Date.now();
      const registerDto = {
        email: `test${timestamp}@example.com`,
        password: 'Password123!',
        name: 'Test User',
      };

      // Register first user
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      // Try to register again with same email
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    let loginEmail: string;

    beforeEach(async () => {
      const timestamp = Date.now();
      loginEmail = `login${timestamp}@example.com`;
      // Register a user for login tests
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).post('/auth/register').send({
        email: loginEmail,
        password: 'Password123!',
        name: 'Login User',
      });
    });

    it('should login with valid credentials, set cookie', async () => {
      const loginDto = {
        email: loginEmail,
        password: 'Password123!',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.user.email).toBe(loginDto.email);
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies && cookies[0]).toContain('access_token');
    });

    it('should return 401 with wrong password', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'WrongPassword!',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('GET /auth/users/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const timestamp = Date.now();
      // Register and login to get token
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `profile${timestamp}@example.com`,
          password: 'Password123!',
          name: 'Profile User',
        });

      const cookies = registerRes.headers['set-cookie'];
      if (cookies && cookies[0]) {
        accessToken = cookies[0].split(';')[0].split('=')[1];
      }
    });

    it('should return user profile with valid cookie', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/auth/users/me')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
    });

    it('should return 401 without cookie', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).get('/auth/users/me').expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookie and return message', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(201);

      expect(response.body).toEqual({ message: 'Logged out' });
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies && cookies[0]).toContain('access_token=');
    });
  });
});
