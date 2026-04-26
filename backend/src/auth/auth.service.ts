import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const existingUser: User | null = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hash = await bcrypt.hash(registerDto.password, 10);

    const newUser: User = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        password: hash,
      },
    });

    return this.generateToken(newUser);
  }

  async login(loginDto: LoginUserDto) {
    const user: User | null = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  generateToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getProfile(userId: number): Promise<{
    id: number;
    email: string;
    name: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<{
    id: number;
    email: string;
    name: string;
  }> {
    const updates: { name?: string; password?: string } = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Name cannot be empty');
      }
      updates.name = name;
    }

    if (dto.currentPassword !== undefined || dto.newPassword !== undefined) {
      if (!dto.currentPassword || !dto.newPassword) {
        throw new BadRequestException(
          'Both currentPassword and newPassword are required to change password',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isCurrentValid = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );
      if (!isCurrentValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const isSame = await bcrypt.compare(dto.newPassword, user.password);
      if (isSame) {
        throw new BadRequestException('New password must be different');
      }

      const hash = await bcrypt.hash(dto.newPassword, 10);
      updates.password = hash;
    }

    if (!updates.name && !updates.password) {
      throw new BadRequestException('No updates provided');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, email: true, name: true },
    });

    return updated;
  }
}
