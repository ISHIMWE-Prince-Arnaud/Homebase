import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  async isHealthy(key: string, heapUsedThreshold = 0.9): Promise<HealthIndicatorResult> {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed;
    const heapTotal = memoryUsage.heapTotal;
    const percentage = heapUsed / heapTotal;

    const isHealthy = percentage < heapUsedThreshold;

    return this.getStatus(key, isHealthy, {
      used: `${Math.round(heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(heapTotal / 1024 / 1024)}MB`,
      percentage: `${Math.round(percentage * 100)}%`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    });
  }
}
