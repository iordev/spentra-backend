import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto';
import { Response } from 'express';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  ) {}

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
