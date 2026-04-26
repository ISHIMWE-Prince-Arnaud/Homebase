export interface MockJwtService {
  sign: jest.Mock;
  verifyAsync: jest.Mock;
}

export function createJwtMock(
  token = 'test-token',
  payload: Record<string, unknown> = { sub: 1, email: 'test@test.com' },
): MockJwtService {
  return {
    sign: jest.fn().mockReturnValue(token),
    verifyAsync: jest.fn().mockResolvedValue(payload),
  };
}
