import { Controller, Post, Body, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { UseGuards, Req, Res } from '@nestjs/common';
import { JwtGuard } from './guards/jwt.guard';
import type { Request } from 'express';
import type { Response } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserId } from 'src/common/decorators/user-id.decorator';
import {
  AuthThrottlerGuard,
  ProfileUpdateThrottlerGuard,
} from 'src/common/guards/throttler.guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthThrottlerGuard)
  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } =
      await this.authService.register(registerUserDto);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: isProd ? undefined : 'localhost',
    });
    return { user };
  }

  @UseGuards(AuthThrottlerGuard)
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.authService.login(loginUserDto);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: isProd ? undefined : 'localhost',
    });
    return { user };
  }

  @UseGuards(JwtGuard)
  @Get('users/me')
  getProfile(@Req() req: Request & { user: { id: number } }): Promise<{
    id: number;
    email: string;
    name: string;
  }> {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtGuard, ProfileUpdateThrottlerGuard)
  @Patch('users/me')
  updateProfile(
    @UserId() userId: number,
    @Body() dto: UpdateProfileDto,
  ): Promise<{
    id: number;
    email: string;
    name: string;
  }> {
    return this.authService.updateProfile(userId, dto);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      domain: isProd ? undefined : 'localhost',
    });
    return { message: 'Logged out' };
  }
}
