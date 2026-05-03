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
        const isPaginated =
          !isArray &&
          controllerReturned !== null &&
          typeof controllerReturned === 'object' &&
          'data' in controllerReturned;

        const data: unknown = isPaginated
          ? (controllerReturned as Record<string, unknown>).data
          : (() => {
              // If the only key is message, return null for data
              if (
                !isArray &&
                controllerReturned !== null &&
                typeof controllerReturned === 'object' &&
                Object.keys(controllerReturned as Record<string, unknown>).every(
                  (k) => k === 'message' || k === 'meta' || k === 'links',
                )
              ) {
                return null;
              }
            return controllerReturned as unknown;
            })();

        const message =
          (!isArray &&
            controllerReturned !== null &&
            typeof controllerReturned === 'object' &&
            'message' in controllerReturned &&
            (controllerReturned as Record<string, unknown>).message) ??
          'Request successful';

        return {
          success: true,
          statusCode,
          message,
          data,
          ...(!isArray &&
            controllerReturned !== null &&
            typeof controllerReturned === 'object' &&
            'meta' in controllerReturned && {
              meta: (controllerReturned as Record<string, unknown>).meta,
            }),
          ...(!isArray &&
            controllerReturned !== null &&
            typeof controllerReturned === 'object' &&
            'links' in controllerReturned && {
              links: (controllerReturned as Record<string, unknown>).links,
            }),
          timestamp: new Date().toISOString(),
        } as Response<T>;
      }),
    );
  }
}
