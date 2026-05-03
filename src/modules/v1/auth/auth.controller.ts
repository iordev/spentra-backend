import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
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
  OAuthRegisterDto,
  RegisterDto,
  ResendVerificationDto,
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
    const oauthToken = await this.authService.generateOAuthToken(result.user.id);
    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}/oauth/callback?token=${oauthToken}`,
    );
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

      return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/signup?${query}`);
    }

    if (!result.user) {
      throw new UnauthorizedException('User not found.');
    }

    // Existing user — issue JWT and redirect to dashboard
    const oauthToken = await this.authService.generateOAuthToken(result.user.id);
    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}/oauth/callback?token=${oauthToken}`,
    );
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

      return res.redirect(`${this.configService.get<string>('FRONTEND_URL')}/signup?${query}`);
    }

    if (!result.user) {
      throw new UnauthorizedException('User not found.');
    }

    // Existing user — issue JWT and redirect to dashboard
    const oauthToken = await this.authService.generateOAuthToken(result.user.id);
    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}/oauth/callback?token=${oauthToken}`,
    );
  }

  @Post('oauth-register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async oauthRegister(
    @Body() dto: OAuthRegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    return this.authService.oauthRegister(dto, res);
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

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  async me(@Req() req: express.Request) {
    return this.authService.me((req.user as User).id);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    const token = req.cookies?.access_token as string | undefined;
    await this.authService.logoutWithToken(token, res);
    return { message: 'Logged out successfully.' };
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

  // ─── Resend Email ─────────────────────────────────────────────────────────────
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 3, ttl: 300000 } }) // 3 per 5 min
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
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

  @Get('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  async exchangeOAuthToken(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    return this.authService.exchangeOAuthToken(token, res);
  }
}
