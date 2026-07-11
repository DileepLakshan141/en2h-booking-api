import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ErrorWithDriverCause,
  ResolveExceptionType,
} from '../types/resolve-exception.type';
import { Prisma } from '../../generated/prisma/client';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { statusCode, message, error } = this.resolveException(exception);

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        (exception as Error)?.stack,
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolveException(exception: unknown): ResolveExceptionType {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const res = response as { message?: string | string[]; error?: string };
        return {
          statusCode: status,
          message: res.message ?? exception.message,
          error: res.error ?? HttpStatus[status],
        };
      }

      return {
        statusCode: status,
        message: exception.message,
        error: HttpStatus[status],
      };
    }

    // general prisma errors handling
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.mapPrismaError(exception);
    }

    // foreign key violation check
    if (this.foreignKeyViolationCheck(exception)) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message:
          'Cannot delete this record because it is referenced by other records',
        error: 'Conflict',
      };
    }

    // default cases handling
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[])?.join(', ');
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${target ?? 'value'} already exists`,
          error: 'Conflict',
        };
      }
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          message:
            'Cannot delete this record because it is referenced by other records',
          error: 'Conflict',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
          error: 'Internal Server Error',
        };
    }
  }

  private foreignKeyViolationCheck(exception: unknown): boolean {
    if (typeof exception !== 'object' || exception === null) return false;
    const err = exception as ErrorWithDriverCause;
    const originalCode = err.cause?.originalCode;
    return originalCode === '23001' || originalCode === '23503';
  }
}
