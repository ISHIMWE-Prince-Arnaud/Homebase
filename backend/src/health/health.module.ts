import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { WebsocketHealthIndicator } from './indicators/websocket.health';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TerminusModule, PrismaModule, RealtimeModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, WebsocketHealthIndicator, MemoryHealthIndicator],
})
export class HealthModule {}
