import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { JwtAccessGuard, JwtRefreshGuard } from './guards';
import * as express from 'express';
import { User } from '@prisma/client';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Login ───────────────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: express.Response) {
    const user = await this.authService.login(loginDto, res);
    return {
      message: 'Login successful.',
      data: user,
    };
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    if (!req.user) {
      throw new UnauthorizedException('User not found.');
    }
    return this.authService.refresh(req.user as User, res);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  async logout(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    if (!req.user) {
      throw new UnauthorizedException('User not found.');
    }
    await this.authService.logout((req.user as User).id, res);

    return {
      message: 'Logged out successfully.',
      data: null,
    };
  }
}
