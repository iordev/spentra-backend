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
    const response = ctx.getResponse<{ statusCode: number }>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((controllerReturned): Response<T> => {
        const isArray = Array.isArray(controllerReturned);
        const isObject =
          !isArray && controllerReturned !== null && typeof controllerReturned === 'object';
        const raw = isObject ? (controllerReturned as Record<string, unknown>) : null;
        const data: unknown =
          isObject && raw !== null && 'data' in raw
            ? raw.data
            : (() => {
                if (
                  isObject &&
                  raw !== null &&
                  Object.keys(raw).every((k) => k === 'message' || k === 'meta' || k === 'links')
                ) {
                  return null;
                }
                return controllerReturned as unknown;
              })();

        // ✅ Safely extract message only if it's actually a string
        const message: string =
          isObject && raw !== null && typeof raw.message === 'string'
            ? raw.message
            : 'Request successful';

        return {
          success: true,
          statusCode,
          message,
          data,
          ...(isObject && raw !== null && 'meta' in raw && { meta: raw.meta }),
          ...(isObject && raw !== null && 'links' in raw && { links: raw.links }),
          timestamp: new Date().toISOString(),
        } as Response<T>;
      }),
    );
  }
}
