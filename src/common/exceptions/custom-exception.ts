import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    private errorCode?: string,
  ) {
    super(message, status);
  }

  getResponse() {
    const status = this.getStatus();
    const response = super.getResponse();

    return {
      message: this.message,
      error: response || HttpStatus[status] || 'Error',
      statusCode: status,
    };
  }
}

// Simple helper functions for common exceptions
export class NotFoundException extends CustomException {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

export class BadRequestException extends CustomException {
  constructor(message: string = 'Bad request') {
    super(message, HttpStatus.BAD_REQUEST, 'BAD_REQUEST');
  }
}

export class UnauthorizedException extends CustomException {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenException extends CustomException {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

export class ConflictException extends CustomException {
  constructor(message: string = 'Conflict') {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}
