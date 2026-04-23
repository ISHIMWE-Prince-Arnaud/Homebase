import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { throttlerConfig } from '../security/throttler.config';

/**
 * Strict rate limiting for auth endpoints (10 req/min)
 * Applied to: POST /auth/register, POST /auth/login
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected getThrottlerDetails() {
    return {
      ttl: throttlerConfig.ttl.short,
      limit: throttlerConfig.limit.short,
    };
  }
}

/**
 * Medium rate limiting for profile updates (20 req/min)
 * Applied to: PATCH /auth/users/me
 */
@Injectable()
export class ProfileUpdateThrottlerGuard extends ThrottlerGuard {
  protected getThrottlerDetails() {
    return {
      ttl: 60000, // 1 minute
      limit: 20, // 20 requests per minute
    };
  }
}

/**
 * Standard rate limiting for general API (100 req/15min)
 * Applied to: All other endpoints via global guard
 */
@Injectable()
export class ApiThrottlerGuard extends ThrottlerGuard {
  protected getThrottlerDetails() {
    return {
      ttl: throttlerConfig.ttl.medium,
      limit: throttlerConfig.limit.medium,
    };
  }
}
