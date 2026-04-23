import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { throttlerConfig } from './throttler.config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => [
        {
          ttl: throttlerConfig.ttl.short,
          limit: throttlerConfig.limit.short,
        },
        {
          ttl: throttlerConfig.ttl.medium,
          limit: throttlerConfig.limit.medium,
        },
        {
          ttl: throttlerConfig.ttl.long,
          limit: throttlerConfig.limit.long,
        },
      ],
    }),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlerConfigModule {}
