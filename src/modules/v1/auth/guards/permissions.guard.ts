import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../../../common';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required permissions from route metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. No permissions required on this route → allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 3. Get user from request (attached by JwtAccessGuard)
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: { permissions?: { name: string }[] } } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied.');
    }

    // 4. Extract user's permissions from role
    const userPermissions: string[] =
      user.role?.permissions?.map((p: { name: string }) => p.name) ?? [];

    // 5. Check if user has AT LEAST ONE required permission
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    return true;
  }
}
