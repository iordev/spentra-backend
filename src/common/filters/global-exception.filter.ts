import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // 1. Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (this.isObject(exceptionResponse)) {
        // ✅ No unnecessary assertion – exceptionResponse is already Record<string, unknown>
        message = this.extractStringProperty(exceptionResponse, 'message') ?? message;
        error = this.extractStringProperty(exceptionResponse, 'error') ?? HttpStatus[status];
      }
    }

    // 2. Handle known Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = prismaError.error;
    }

    // 3. Handle validation errors
    else if (this.isValidationError(exception)) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      error = 'Bad Request';
    }

    // 4. Build and send response
    response.status(status).json({
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // Type guard: is it a plain object?
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  // Safely extract a string property
  private extractStringProperty(obj: Record<string, unknown>, key: string): string | undefined {
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
  }

  // Type guard for validation errors
  private isValidationError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'ValidationError' || exception.name === 'BadRequestException')
    );
  }

  // Handle Prisma error codes
  private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const target = this.extractPrismaMetaTarget(exception.meta);
        const field = target ? target.join(', ') : 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `${field} already exists`,
          error: 'Conflict',
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed',
          error: 'Bad Request',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
          error: 'Internal Server Error',
        };
    }
  }

  // Add this helper method inside the same class
  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }

  private extractPrismaMetaTarget(
    meta: Prisma.PrismaClientKnownRequestError['meta'],
  ): string[] | undefined {
    if (!this.isObject(meta)) return undefined;
    const target = meta.target;
    // Use the type guard to safely return string[] or undefined
    return this.isStringArray(target) ? target : undefined;
  }
}
