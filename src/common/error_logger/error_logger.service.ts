import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ErrorLogger } from './entities/error_logger.entity';

@Injectable()
export class ErrorLoggerService implements LoggerService {
  constructor(
    @InjectModel(ErrorLogger)
    private readonly errorLoggerModel: typeof ErrorLogger,
  ) {}

  async error(message: string, stack: string) {
    await this.errorLoggerModel.create({ message, stack });
  }

  async findAll() {
    return await this.errorLoggerModel.findAll({
      attributes: ['errorID', 'message', 'timestamp'],
    });
  }

  async findOne(errorID: number) {
    return await this.errorLoggerModel.findOne({ where: { errorID } });
  }
  log(message: string) {}

  warn(message: string) {}

  debug(message: string) {}

  verbose(message: string) {}
}
