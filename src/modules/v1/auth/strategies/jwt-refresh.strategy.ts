import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req?.cookies as Record<string, string>)?.refresh_token ?? null,
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET as string, // ← cast to string
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: number; email: string }) {
    const rawToken = (req?.cookies as Record<string, string>)?.refresh_token;

    if (!rawToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User no longer exists.');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('No refresh token found, please login again.');
    }

    const tokenMatches = await bcrypt.compare(rawToken, user.refreshToken);

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token invalid, please login again.');
    }

    return user;
  }
}
