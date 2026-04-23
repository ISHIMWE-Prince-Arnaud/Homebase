import { Injectable, Logger } from '@nestjs/common';
import type { DefaultEventsMap, RemoteSocket, Server } from 'socket.io';
import { householdRoom, userRoom, RealtimeEvents } from './realtime.events';
import type { RealtimeEvent } from './realtime.events';
import type { RealtimeSocketData } from './realtime.types';

@Injectable()
export class RealtimeService {
  private server?: Server;
  private readonly logger = new Logger(RealtimeService.name);

  registerServer(server: Server) {
    this.server = server;
    this.logger.log('Realtime server registered');
  }

  getServer(): Server | undefined {
    return this.server;
  }

  emitToHousehold(householdId: number, event: RealtimeEvent, payload: unknown) {
    if (!this.server || !householdId) {
      return;
    }
    this.server.to(householdRoom(householdId)).emit(event, payload);
  }

  emitToUser(userId: number, event: RealtimeEvent, payload: unknown) {
    if (!this.server || !userId) {
      return;
    }
    this.server.to(userRoom(userId)).emit(event, payload);
  }

  async syncUserHousehold(
    userId: number,
    nextHouseholdId: number | null,
    previousHouseholdId?: number | null,
  ) {
    if (!this.server || !userId) {
      return;
    }
    type HouseholdSocket = RemoteSocket<DefaultEventsMap, RealtimeSocketData>;
    const sockets = (await this.server
      .in(userRoom(userId))
      .fetchSockets()) as HouseholdSocket[];
    for (const socket of sockets) {
      if (typeof previousHouseholdId === 'number') {
        socket.leave(householdRoom(previousHouseholdId));
      }
      if (typeof nextHouseholdId === 'number') {
        socket.join(householdRoom(nextHouseholdId));
      }
      socket.data.householdId = nextHouseholdId ?? undefined;
      socket.emit(RealtimeEvents.CONNECTION_READY, {
        userId,
        householdId: nextHouseholdId ?? null,
      });
    }
  }
}
