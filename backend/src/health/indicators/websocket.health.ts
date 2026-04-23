import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class WebsocketHealthIndicator extends HealthIndicator {
  constructor(private realtimeService: RealtimeService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const server = this.realtimeService.getServer();
      const connections = server ? server.sockets.sockets.size : 0;

      return this.getStatus(key, true, {
        connections,
        status: server ? 'up' : 'down',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        message: error.message,
      });
    }
  }
}
