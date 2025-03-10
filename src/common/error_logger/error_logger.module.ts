import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ErrorLoggerService } from './error_logger.service';
import { ErrorLoggerController } from './error_logger.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ErrorLogger } from './entities/error_logger.entity';
import { setLoggerInstance } from './logger.util';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([ErrorLogger])],
  controllers: [ErrorLoggerController],
  providers: [ErrorLoggerService],
  exports:[ErrorLoggerService]
})
export class ErrorLoggerModule implements OnModuleInit {
  constructor(private readonly errorLogger: ErrorLoggerService) {}

  onModuleInit() {
    setLoggerInstance(this.errorLogger);
  }
}