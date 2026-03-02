import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((controllerReturned) => {
        const data = controllerReturned?.data ?? controllerReturned;
        const message = controllerReturned?.message ?? 'Request successful';

        return {
          success: true,
          statusCode,
          message,
          data,
          ...(controllerReturned?.meta && { meta: controllerReturned.meta }),
          ...(controllerReturned?.links && { links: controllerReturned.links }),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
