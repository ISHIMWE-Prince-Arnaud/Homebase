import { Module } from '@nestjs/common';
import { HouseholdService } from './household.service';
import { HouseholdController } from './household.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [RealtimeModule, NotificationModule],
  controllers: [HouseholdController],
  providers: [HouseholdService, PrismaService],
  exports: [HouseholdService],
})
export class HouseholdModule {}
