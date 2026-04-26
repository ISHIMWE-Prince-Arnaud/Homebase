import { RealtimeService } from './realtime.service';
import { RealtimeEvents } from './realtime.events';

describe('RealtimeService', () => {
  let service: RealtimeService;

  let mockServer: any;

  beforeEach(() => {
    service = new RealtimeService();

    // Create a mock Socket.IO server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
      fetchSockets: jest.fn().mockResolvedValue([]),
    };
  });

  // ─── registerServer() ──────────────────────────────────────────────────────────

  describe('registerServer()', () => {
    it('should store server reference and log', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      // After registering, emitToHousehold should work (not no-op)

      service.emitToHousehold(10, RealtimeEvents.CHORE_CREATED, {});
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.to).toHaveBeenCalledWith('household:10');
    });
  });

  // ─── emitToHousehold() ─────────────────────────────────────────────────────────

  describe('emitToHousehold()', () => {
    it('should emit event to household room', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      service.emitToHousehold(10, RealtimeEvents.CHORE_CREATED, { choreId: 1 });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.to).toHaveBeenCalledWith('household:10');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.emit).toHaveBeenCalledWith(
        RealtimeEvents.CHORE_CREATED,
        { choreId: 1 },
      );
    });

    it('should be no-op if server not registered', () => {
      // Don't register server

      service.emitToHousehold(10, RealtimeEvents.CHORE_CREATED, {});

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should be no-op if householdId is falsy', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      service.emitToHousehold(0, RealtimeEvents.CHORE_CREATED, {});
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.emitToHousehold(null as any, RealtimeEvents.CHORE_CREATED, {});

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  // ─── emitToUser() ──────────────────────────────────────────────────────────────

  describe('emitToUser()', () => {
    it('should emit event to user room', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      service.emitToUser(5, RealtimeEvents.NOTIFICATION_CREATED, { id: 1 });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.to).toHaveBeenCalledWith('user:5');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.emit).toHaveBeenCalledWith(
        RealtimeEvents.NOTIFICATION_CREATED,
        { id: 1 },
      );
    });

    it('should be no-op if server not registered', () => {
      service.emitToUser(5, RealtimeEvents.NOTIFICATION_CREATED, {});

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should be no-op if userId is falsy', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      service.emitToUser(0, RealtimeEvents.NOTIFICATION_CREATED, {});
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.emitToUser(null as any, RealtimeEvents.NOTIFICATION_CREATED, {});

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  // ─── syncUserHousehold() ───────────────────────────────────────────────────────

  describe('syncUserHousehold()', () => {
    it('should leave old household room, join new, update socket data', async () => {
      const mockSocket = {
        leave: jest.fn(),
        join: jest.fn(),
        data: {} as { householdId?: number },
        emit: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      mockServer.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([mockSocket]),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      await service.syncUserHousehold(5, 10, 20);

      expect(mockSocket.leave).toHaveBeenCalledWith('household:20');

      expect(mockSocket.join).toHaveBeenCalledWith('household:10');

      expect(mockSocket.data.householdId).toBe(10);
    });

    it('should emit CONNECTION_READY to each socket', async () => {
      const mockSocket1 = {
        leave: jest.fn(),
        join: jest.fn(),
        data: {} as { householdId?: number },
        emit: jest.fn(),
      };
      const mockSocket2 = {
        leave: jest.fn(),
        join: jest.fn(),
        data: {} as { householdId?: number },
        emit: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      mockServer.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([mockSocket1, mockSocket2]),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      await service.syncUserHousehold(5, 10, null);

      expect(mockSocket1.emit).toHaveBeenCalledWith(
        RealtimeEvents.CONNECTION_READY,
        { userId: 5, householdId: 10 },
      );

      expect(mockSocket2.emit).toHaveBeenCalledWith(
        RealtimeEvents.CONNECTION_READY,
        { userId: 5, householdId: 10 },
      );
    });

    it('should be no-op if server not registered', async () => {
      await service.syncUserHousehold(5, 10, null);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.in).not.toHaveBeenCalled();
    });

    it('should be no-op if userId is falsy', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      await service.syncUserHousehold(0, 10, null);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await service.syncUserHousehold(null as any, 10, null);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockServer.in).not.toHaveBeenCalled();
    });

    it('should handle null nextHouseholdId (sets householdId to undefined)', async () => {
      const mockSocket = {
        leave: jest.fn(),
        join: jest.fn(),
        data: {} as { householdId?: number },
        emit: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      mockServer.in.mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([mockSocket]),
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.registerServer(mockServer);

      await service.syncUserHousehold(5, null, 20);

      expect(mockSocket.leave).toHaveBeenCalledWith('household:20');

      expect(mockSocket.join).not.toHaveBeenCalled();

      expect(mockSocket.data.householdId).toBeUndefined();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        RealtimeEvents.CONNECTION_READY,
        { userId: 5, householdId: null },
      );
    });
  });
});
