import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SlidingSessionMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req?.cookies?.access_token as string | undefined;

    // No token present — skip, let guard handle it
    if (!accessToken) {
      return next();
    }

    try {
      // 1. Verify the access token
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
      }>(accessToken, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });

      // 2. Load user from DB
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      // 3. User not found or soft deleted — skip
      if (!user || user.deletedAt) {
        return next();
      }

      // 4. Token is valid + user is active → reset the 30min timer
      await this.authService.extendSession(user, res);
    } catch (_err) {
      // Token expired or invalid — skip, let guard handle the 401
    }

    return next();
  }
}
