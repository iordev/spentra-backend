import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto, LoginDto, ResetPasswordDto } from './dto';
import * as express from 'express';
import { Response } from 'express';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

type LoginUserPayload = Prisma.UserGetPayload<{
  include: {
    role: {
      select: {
        id: true;
        name: true;
        description: true;
        permissions: { select: { id: true; name: true } };
      };
    };
    occupation: { select: { id: true; name: true } };
    currency: { select: { id: true; name: true; code: true; symbol: true } };
    timezone: { select: { id: true; name: true } };
    country: { select: { id: true; name: true; code: true } };
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async getOAuthProfile(data: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    provider: string;
  }) {
    // Check if user already exists
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    // If already registered, just login normally
    if (existing) {
      return { isNewUser: false, user: existing };
    }

    // If new user, return profile data for the frontend wizard
    return {
      isNewUser: true,
      profile: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
      },
    };
  }

  async oauthLogin(user: User, res: express.Response) {
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    await this.hashAndStoreRefreshToken(user.id, refreshToken);
    this.setTokenCookies(res, accessToken, refreshToken);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  async login(loginDto: LoginDto, res: Response) {
    const { identifier, password } = loginDto;

    // 1. Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        occupation: {
          select: {
            id: true,
            name: true,
          },
        },
        currency: {
          select: {
            id: true,
            name: true,
            code: true,
            symbol: true,
          },
        },
        timezone: {
          select: {
            id: true,
            name: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // 2. User not found
    if (!user) {
      throw new NotFoundException('Invalid credentials.');
    }

    // 3. Soft deleted account
    if (user.deletedAt) {
      throw new UnauthorizedException('Account no longer exists.');
    }

    // 4. Email not verified  ← add this
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    // 5. OAuth-only account (no password set)
    if (!user.password) {
      throw new UnauthorizedException('This account uses OAuth. Please login with your provider.');
    }

    // 6. Wrong password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // 7. Generate tokens, store hash, set cookies
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    await this.hashAndStoreRefreshToken(user.id, refreshToken);
    this.setTokenCookies(res, accessToken, refreshToken);

    return this.formatUser(user);
  }

  async refresh(user: User, res: Response) {
    // User already validated by JwtRefreshStrategy
    // Just issue new tokens (rotation)
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    await this.hashAndStoreRefreshToken(user.id, refreshToken);
    this.setTokenCookies(res, accessToken, refreshToken);

    return { message: 'Session extended.' };
  }

  async logout(userId: number, res: Response) {
    // Clear refresh token from DB
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Clear cookies
    this.clearTokenCookies(res);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = dto;

    // 1. Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match.');
    }

    // 2. Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // 3. Verify current password
    const passwordMatches = await bcrypt.compare(currentPassword, user.password ?? '');
    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    // 4. Check if new password is the same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password ?? '');
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password.');
    }

    // 5. Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully.' };
  }

  async forgotPassword(email: string) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 2. If user not found return error
    if (!user) {
      throw new NotFoundException('No account found with that email address.');
    }

    // 3. Generate a secure random token
    const token = randomBytes(32).toString('hex');

    // 4. Store token and expiry in DB (15 minutes)
    await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // 5. Send reset link via Resend
    const resetLink = `${this.config.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    await this.mailService.sendResetPasswordLink(user.email, user.firstName, resetLink);

    return { message: `Password reset link has been sent to ${user.email}.` };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = dto;

    // 1. Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match.');
    }

    // 2. Find user by token
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // 3. Check if token is expired
    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update password and clear token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    return { message: 'Password reset successfully. You can now login.' };
  }

  async verifyEmail(token: string) {
    try {
      // 1. Find user by verification token
      const user = await this.prisma.user.findFirst({
        where: { verificationToken: token },
      });

      // 2. Token not found
      if (!user) {
        throw new BadRequestException('Invalid or expired verification token.');
      }

      // 3. Already verified
      if (user.emailVerified) {
        throw new BadRequestException('Email is already verified.');
      }

      // 4. Update user — set emailVerified to true and clear token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
        },
      });

      return { message: 'Email verified successfully. You can now login.' };
    } catch (error) {
      console.error('verifyEmail error:', error);
      throw error;
    }
  }

  async extendSession(user: User, res: Response) {
    // Called on every active request to reset the 30min timer
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email);
    await this.hashAndStoreRefreshToken(user.id, refreshToken);
    this.setTokenCookies(res, accessToken, refreshToken);
  }

  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '30m', // ← inactivity window
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30m', // ← same inactivity window
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  private async hashAndStoreRefreshToken(userId: number, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const maxAge = 30 * 60 * 1000; // 30 minutes in ms

    res.cookie('access_token', accessToken, {
      httpOnly: true, // ← JS cannot access this cookie
      secure: isProd, // ← HTTPS only in production
      sameSite: 'strict', // ← CSRF protection
      maxAge, // ← expires in 30 mins
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge, // ← same 30-min window
    });
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  private clearTokenCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  // ─── Sliding Session (called by middleware) ───────────────────────────────────

  private formatUser(user: LoginUserPayload) {
    const {
      password: _password,
      refreshToken: _refreshToken,
      verificationToken: _verificationToken,
      resetPasswordToken: _resetPasswordToken,
      resetPasswordExpiry: _resetPasswordExpiry,
      deletedAt: _deletedAt,
      roleId: _roleId,
      occupationId: _occupationId,
      currencyId: _currencyId,
      timezoneId: _timezoneId,
      countryId: _countryId,
      ...safeUser
    } = user;

    return safeUser;
  }
}
