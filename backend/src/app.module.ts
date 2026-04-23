import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HouseholdModule } from './household/household.module';
import { ChoreModule } from './chore/chore.module';
import { ExpenseModule } from './expense/expense.module';
import { NeedModule } from './need/need.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ThrottlerConfigModule } from './common/security/throttler.module';
import { ApiThrottlerGuard } from './common/guards/throttler.guards';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerConfigModule,
    PrismaModule,
    AuthModule,
    HouseholdModule,
    ChoreModule,
    ExpenseModule,
    NeedModule,
    PaymentModule,
    NotificationModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ApiThrottlerGuard,
    },
  ],
})
export class AppModule {}
