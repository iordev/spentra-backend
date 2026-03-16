import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // info contains the reason why it failed
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Session expired, please login again.');
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token, please login again.');
      }

      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('Unauthenticated, please login.');
      }

      throw new UnauthorizedException('Unauthenticated, please login.');
    }

    return user;
  }
}
