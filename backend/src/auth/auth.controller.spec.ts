import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue({ accessToken: 'token', user: mockUser }),
      login: jest.fn().mockResolvedValue({ accessToken: 'token', user: mockUser }),
      getProfile: jest.fn().mockResolvedValue(mockUser),
      updateProfile: jest.fn().mockResolvedValue(mockUser),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register()', () => {
    it('calls authService.register, sets cookie, returns user', async () => {
      const dto = { email: 'test@test.com', password: 'pass123', name: 'Test' };
      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.register(dto, mockRes);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('login()', () => {
    it('calls authService.login, sets cookie, returns user', async () => {
      const dto = { email: 'test@test.com', password: 'pass123' };
      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.login(dto, mockRes);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('getProfile()', () => {
    it('calls authService.getProfile with user id from request', async () => {
      const mockReq = { user: { id: 1 } };

      const result = await controller.getProfile(mockReq as any);

      expect(authService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile()', () => {
    it('calls authService.updateProfile with userId and dto', async () => {
      const dto = { name: 'Updated Name' };

      const result = await controller.updateProfile(1, dto);

      expect(authService.updateProfile).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout()', () => {
    it('clears cookie and returns message', () => {
      const mockRes = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      const result = controller.logout(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(result).toEqual({ message: 'Logged out' });
    });
  });
});
