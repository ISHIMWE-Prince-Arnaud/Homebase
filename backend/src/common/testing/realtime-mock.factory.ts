export interface MockRealtimeService {
  registerServer: jest.Mock;
  emitToHousehold: jest.Mock;
  emitToUser: jest.Mock;
  syncUserHousehold: jest.Mock;
}

export function createRealtimeMock(): MockRealtimeService {
  return {
    registerServer: jest.fn(),
    emitToHousehold: jest.fn(),
    emitToUser: jest.fn(),
    syncUserHousehold: jest.fn(),
  };
}
