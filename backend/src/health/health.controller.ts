import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { WebsocketHealthIndicator } from './indicators/websocket.health';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private websocketHealth: WebsocketHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.websocketHealth.isHealthy('websocket'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([() => this.prismaHealth.isHealthy('database')]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.websocketHealth.isHealthy('websocket'),
    ]);
  }
}
