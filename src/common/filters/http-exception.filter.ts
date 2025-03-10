import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { logger } from '../error_logger/logger.util';

export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    let status = exception.getStatus();
    let message = exception.getResponse();
    logger.error(exception.message, exception.stack);
    return response.status(status).json({
      status: false,
      message,
    });
  }
}
