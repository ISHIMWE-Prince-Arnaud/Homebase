import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Security E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate Limiting', () => {
    it('POST /auth/login > 10 req/min from same IP returns 429', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Make 11 requests to exceed the limit
      const requests = Array(11)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).post('/auth/login').send(loginDto),
        );

      const responses = await Promise.all(requests);

      // First 10 should succeed (or fail with auth error, not rate limit)
      for (let i = 0; i < 10; i++) {
        expect([200, 401, 404]).toContain(responses[i].status);
      }

      // 11th request should be rate limited
      expect(responses[10].status).toBe(429);
    });
  });

  describe('CORS', () => {
    it('Missing Origin header on CORS request returns 403 or blocked', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/users/me')
        .set('Origin', '');

      // Should be rejected due to CORS
      expect([403, 401]).toContain(response.status);
    });
  });

  describe('Request Size Limiting', () => {
    it('Large payload (>10kb) to any endpoint returns 413', async () => {
      const largePayload = {
        email: 'test@example.com',
        password: 'password123',
        // Add enough data to exceed 10kb
        data: 'x'.repeat(12000),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(largePayload);

      expect(response.status).toBe(413);
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('Response includes all helmet headers', async () => {
      const response = await request(app.getHttpServer()).get('/');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['referrer-policy']).toBeDefined();
    });

    it('X-Content-Type-Options: nosniff is present in all responses', async () => {
      const response = await request(app.getHttpServer()).get('/');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('X-Frame-Options: DENY is present in all responses', async () => {
      const response = await request(app.getHttpServer()).get('/');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('Strict-Transport-Security is present in production', async () => {
      // This test would need to run with NODE_ENV=production
      // For now, we'll skip it in development
      const isProd = process.env.NODE_ENV === 'production';

      if (isProd) {
        const response = await request(app.getHttpServer()).get('/');

        expect(response.headers['strict-transport-security']).toBeDefined();
      }
    });
  });
});
