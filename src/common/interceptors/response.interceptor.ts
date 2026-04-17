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
        const isArray = Array.isArray(controllerReturned);
        const isPaginated = !isArray && controllerReturned && 'data' in controllerReturned;

        const data = isPaginated ? controllerReturned.data : controllerReturned;
        const message = (!isArray && controllerReturned?.message) ?? 'Request successful';

        return {
          success: true,
          statusCode,
          message,
          data,
          ...(!isArray && controllerReturned?.meta && { meta: controllerReturned.meta }),
          ...(!isArray && controllerReturned?.links && { links: controllerReturned.links }),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
