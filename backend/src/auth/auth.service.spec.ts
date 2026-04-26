import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createPrismaMock, type MockPrismaService } from '../common/testing';

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: jest.fn().mockResolvedValue(true),
  },
}));

import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: MockPrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    jwtService = { sign: jest.fn().mockReturnValue('test-token') } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── register() ────────────────────────────────────────────────────────────────

  describe('register()', () => {
    const registerDto = { name: 'John', email: 'john@test.com', password: 'secret123' };
    const hashedPassword = '$2b$10$hashedpassword';
    const createdUser = {
      id: 1,
      email: 'john@test.com',
      name: 'John',
      password: hashedPassword,
      householdId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a new user successfully and return token+user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('test-token');
      expect(result.user).toEqual({
        id: 1,
        email: 'john@test.com',
        name: 'John',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createdUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should hash password with bcrypt before saving', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);

      await service.register(registerDto);

      const createCall = prismaMock.user.create.mock.calls[0][0];
      const savedPassword = createCall.data.password;
      const isHashed = await bcrypt.compare('secret123', savedPassword);
      expect(isHashed).toBe(true);
    });

    it('should generate avatar URL with random index', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);

      await service.register(registerDto);

      const createCall = prismaMock.user.create.mock.calls[0][0];
      expect(createCall.data.password).toMatch(
        /^\$2b\$10\$/
      );
    });
  });

  // ─── login() ───────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginDto = { email: 'john@test.com', password: 'secret123' };
    const hashedPassword = '$2b$10$hashedpassword';
    const user = {
      id: 1,
      email: 'john@test.com',
      name: 'John',
      password: hashedPassword,
      householdId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should log in with valid credentials, returns token', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('test-token');
      expect(result.user.id).toBe(1);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── generateToken() ───────────────────────────────────────────────────────────

  describe('generateToken()', () => {
    it('should return { accessToken, user } with correct fields from jwtService.sign', () => {
      const user = {
        id: 5,
        email: 'a@b.com',
        name: 'Alice',
        password: 'hash',
        householdId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.generateToken(user as any);

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 5, email: 'a@b.com' });
      expect(result).toEqual({
        accessToken: 'test-token',
        user: { id: 5, email: 'a@b.com', name: 'Alice' },
      });
    });
  });

  // ─── getProfile() ─────────────────────────────────────────────────────────────

  describe('getProfile()', () => {
    it('should return user profile by id', async () => {
      const profile = { id: 1, email: 'john@test.com', name: 'John' };
      prismaMock.user.findUnique.mockResolvedValue(profile);

      const result = await service.getProfile(1);

      expect(result).toEqual(profile);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, email: true, name: true },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── updateProfile() ──────────────────────────────────────────────────────────

  describe('updateProfile()', () => {
    const userId = 1;
    const hashedPassword = '$2b$10$hashedpassword';

    it('should update name only', async () => {
      const updated = { id: 1, email: 'john@test.com', name: 'NewName' };
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile(userId, { name: 'NewName' });

      expect(result.name).toBe('NewName');
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { name: 'NewName' },
        }),
      );
    });

    it('should update password when currentPassword is valid and new is different', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ password: hashedPassword });
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // currentPassword valid
        .mockResolvedValueOnce(false); // newPassword is different
      prismaMock.user.update.mockResolvedValue({
        id: 1,
        email: 'john@test.com',
        name: 'John',
      });

      await service.updateProfile(userId, {
        currentPassword: 'oldPass',
        newPassword: 'newPass123',
      });

      const updateCall = prismaMock.user.update.mock.calls[0][0];
      expect(updateCall.data.password).toBeDefined();
      expect(updateCall.data.password).not.toBe('newPass123'); // should be hashed
    });

    it('should throw BadRequestException if name is empty string', async () => {
      await expect(
        service.updateProfile(userId, { name: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if only currentPassword provided (missing newPassword)', async () => {
      await expect(
        service.updateProfile(userId, { currentPassword: 'oldPass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if currentPassword is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ password: hashedPassword });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updateProfile(userId, {
          currentPassword: 'wrongPass',
          newPassword: 'newPass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if newPassword same as old', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ password: hashedPassword });
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // currentPassword valid
        .mockResolvedValueOnce(true); // newPassword same as old

      await expect(
        service.updateProfile(userId, {
          currentPassword: 'samePass',
          newPassword: 'samePass',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no updates provided', async () => {
      await expect(
        service.updateProfile(userId, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
