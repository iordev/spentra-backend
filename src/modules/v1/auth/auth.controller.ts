import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CheckEmailDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto';
import { JwtAccessGuard, JwtRefreshGuard } from './guards';
import * as express from 'express';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { CheckUsernameDto } from './dto/check-username.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ─── OAuth Note ───────────────────────────────────────────────────────────────
  // All OAuth providers (Google, Microsoft, Facebook) follow the same flow:
  // 1. User logs in with their social account
  // 2. We receive their basic profile (email, name, avatar) from the provider
  // 3. If NEW user → redirect to frontend wizard with profile data as query params
  //                → user fills in remaining required fields
  //                → frontend submits everything to POST /users
  //                → user record is created in DB
  // 4. If EXISTING user → issue JWT cookies → redirect to dashboard
  // No user record is created during OAuth — only after the wizard is completed.

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport automatically redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: express.Request, @Res() res: express.Response) {
    const result = req.user as Awaited<ReturnType<typeof this.authService.getOAuthProfile>>;

    if (result.isNewUser) {
      // Redirect to frontend wizard with profile data as query params
      const profile = result.profile ?? {
        email: '',
        firstName: '',
        lastName: '',
        avatarUrl: null,
      };

      const query = new URLSearchParams({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl ?? '',
        provider: 'google',
      }).toString();

      return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/register?${query}`);
    }

    if (!result.user) {
      throw new UnauthorizedException('User not found.');
    }

    // Existing user — issue JWT and redirect to dashboard
    await this.authService.oauthLogin(result.user, res);
    // return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/dashboard`);
    return res.json({
      isNewUser: false,
      message: 'Login successful.',
      user: result.user, // ← add this to see the user data
    });
  }

  // ─── Microsoft OAuth ──────────────────────────────────────────────────────────

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  microsoftLogin() {
    // Passport automatically redirects to Microsoft
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftCallback(@Req() req: express.Request, @Res() res: express.Response) {
    const result = req.user as Awaited<ReturnType<typeof this.authService.getOAuthProfile>>;

    if (result.isNewUser) {
      const profile = result.profile ?? {
        email: '',
        firstName: '',
        lastName: '',
        avatarUrl: null,
      };

      // Redirect to frontend wizard with profile data as query params
      const query = new URLSearchParams({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl ?? '',
        provider: 'microsoft',
      }).toString();

      return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/register?${query}`);
    }

    if (!result.user) {
      throw new UnauthorizedException('User not found.');
    }

    // Existing user — issue JWT and redirect to dashboard
    await this.authService.oauthLogin(result.user, res);
    // return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/dashboard`)
    return res.json({
      isNewUser: false,
      message: 'Login successful.',
      user: result.user,
    });
  }

  // ─── Facebook OAuth ───────────────────────────────────────────────────────────

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {
    // Passport automatically redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: express.Request, @Res() res: express.Response) {
    const result = req.user as Awaited<ReturnType<typeof this.authService.getOAuthProfile>>;

    if (result.isNewUser) {
      const profile = result.profile ?? {
        email: '',
        firstName: '',
        lastName: '',
        avatarUrl: null,
      };

      // Redirect to frontend wizard with profile data as query params
      const query = new URLSearchParams({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl ?? '',
        provider: 'facebook',
      }).toString();

      return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/register?${query}`);
    }

    if (!result.user) {
      throw new UnauthorizedException('User not found.');
    }

    // Existing user — issue JWT and redirect to dashboard
    await this.authService.oauthLogin(result.user, res);
    // return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/dashboard`)
    return res.json({
      isNewUser: false,
      message: 'Login successful.',
      user: result.user,
    });
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
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
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
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

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  async changePassword(@Req() req: express.Request, @Body() changePasswordDto: ChangePasswordDto) {
    if (!req.user) {
      throw new UnauthorizedException('User not found.');
    }
    return await this.authService.changePassword((req.user as User).id, changePasswordDto);
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────────
  @Throttle({ strict: { limit: 3, ttl: 300000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  // ─── Reset Password ───────────────────────────────────────────────────────────
  @Throttle({ strict: { limit: 5, ttl: 300000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────────
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmail(dto.email);
  }

  @Post('check-username')
  @HttpCode(HttpStatus.OK)
  async checkUsername(@Body() dto: CheckUsernameDto) {
    return this.authService.checkUsername(dto.username);
  }
}
