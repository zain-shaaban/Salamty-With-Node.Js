import { ErrorLoggerService } from './error_logger.service';

let loggerInstance: ErrorLoggerService | null = null;

export const setLoggerInstance = (logger: ErrorLoggerService) => {
  loggerInstance = logger;
};

export const logger = {
  error: async (message: string, stack: string) => {
    await loggerInstance.error(message, stack);
  }
};