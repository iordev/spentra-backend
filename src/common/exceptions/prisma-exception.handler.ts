import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  CustomException,
  NotFoundException,
} from './custom-exception';

export class PrismaExceptionHandler {
  static handle(exception: any): never {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          const target = exception.meta?.target as string[];
          const field = target ? target[0] : 'resource';
          throw new ConflictException(`${field} already exists`);
        }
        case 'P2025':
          throw new NotFoundException('Record not found');
        case 'P2003':
          throw new BadRequestException('Invalid relationship data');
        case 'P2000':
          throw new BadRequestException('Value too long for field');
        case 'P2011':
          throw new BadRequestException('Null constraint violation');
        case 'P2012':
          throw new BadRequestException('Missing required field');
        default:
          throw new CustomException('Database operation failed', 500, 'DATABASE_ERROR');
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('Invalid data format');
    }

    // If not a Prisma error, just rethrow
    throw exception;
  }
}
