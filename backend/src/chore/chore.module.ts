import { PrismaService } from './../prisma/prisma.service';
import { Module } from '@nestjs/common';
import { ChoreService } from './chore.service';
import { ChoreController } from './chore.controller';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [RealtimeModule, NotificationModule],
  controllers: [ChoreController],
  providers: [ChoreService, PrismaService],
})
export class ChoreModule {}
