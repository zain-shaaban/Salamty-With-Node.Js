import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { logger } from '../error_logger/logger.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status = exception.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;

    logger.error(exception.message, exception.stack);
    return response.status(status).json({
      status: false,
      message: exception.message,
    });
  }
}
