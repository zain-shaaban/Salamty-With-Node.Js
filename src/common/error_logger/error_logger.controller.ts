import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ErrorLoggerService } from './error_logger.service';
import { asyncHandler } from '../utils/async-handler';

@Controller('errors')
export class ErrorLoggerController {
  constructor(private readonly errorLoggerService: ErrorLoggerService) {}
  @Get()
  async findAll() {
    return await asyncHandler(this.errorLoggerService.findAll());
  }

  @Get(':errorID')
  async findOne(@Param('errorID') errorID: string) {
    return await asyncHandler(this.errorLoggerService.findOne(errorID));
  }
}
