import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { AuthThrottlerGuard, ProfileUpdateThrottlerGuard, ApiThrottlerGuard } from './throttler.guards';
import { throttlerConfig } from '../security/throttler.config';

describe('Throttler Guards', () => {
  let authGuard: AuthThrottlerGuard;
  let profileUpdateGuard: ProfileUpdateThrottlerGuard;
  let apiGuard: ApiThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthThrottlerGuard,
        ProfileUpdateThrottlerGuard,
        ApiThrottlerGuard,
      ],
    }).compile();

    authGuard = module.get<AuthThrottlerGuard>(AuthThrottlerGuard);
    profileUpdateGuard = module.get<ProfileUpdateThrottlerGuard>(ProfileUpdateThrottlerGuard);
    apiGuard = module.get<ApiThrottlerGuard>(ApiThrottlerGuard);
  });

  describe('AuthThrottlerGuard', () => {
    it('should have correct throttler details for auth endpoints', () => {
      const details = authGuard['getThrottlerDetails']();
      
      expect(details).toEqual({
        ttl: throttlerConfig.ttl.short,
        limit: throttlerConfig.limit.short,
      });
    });
  });

  describe('ProfileUpdateThrottlerGuard', () => {
    it('should have correct throttler details for profile updates', () => {
      const details = profileUpdateGuard['getThrottlerDetails']();
      
      expect(details).toEqual({
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute
      });
    });
  });

  describe('ApiThrottlerGuard', () => {
    it('should have correct throttler details for general API', () => {
      const details = apiGuard['getThrottlerDetails']();
      
      expect(details).toEqual({
        ttl: throttlerConfig.ttl.medium,
        limit: throttlerConfig.limit.medium,
      });
    });
  });

  describe('Throttler Configuration', () => {
    it('should load configuration from environment variables', () => {
      expect(throttlerConfig.ttl.short).toBeGreaterThan(0);
      expect(throttlerConfig.limit.short).toBeGreaterThan(0);
      expect(throttlerConfig.ttl.medium).toBeGreaterThan(0);
      expect(throttlerConfig.limit.medium).toBeGreaterThan(0);
      expect(throttlerConfig.ttl.long).toBeGreaterThan(0);
      expect(throttlerConfig.limit.long).toBeGreaterThan(0);
    });

    it('should have reasonable default values', () => {
      expect(throttlerConfig.ttl.short).toBe(60000); // 1 minute
      expect(throttlerConfig.limit.short).toBe(10);
      expect(throttlerConfig.ttl.medium).toBe(900000); // 15 minutes
      expect(throttlerConfig.limit.medium).toBe(100);
      expect(throttlerConfig.ttl.long).toBe(3600000); // 1 hour
      expect(throttlerConfig.limit.long).toBe(300);
    });
  });
});
