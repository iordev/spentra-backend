import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const BaseUrl = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const protocol = request.protocol;
  const host = request.get('host');
  const path = request.path; // e.g. '/api/v1/permissions'
  return `${protocol}://${host}${path}`;
});
