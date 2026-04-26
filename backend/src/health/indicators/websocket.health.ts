import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class WebsocketHealthIndicator extends HealthIndicator {
  constructor(private realtimeService: RealtimeService) {
    super();
  }

  isHealthy(key: string): HealthIndicatorResult {
    try {
      const server = this.realtimeService.getServer();
      const connections = server ? server.sockets.sockets.size : 0;

      return this.getStatus(key, true, {
        connections,
        status: server ? 'up' : 'down',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message: error.message,
      });
    }
  }
}
