import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import dbConfig from './config/db.config';
import { JwtModule } from '@nestjs/jwt';
import { ErrorLoggerModule } from './common/error_logger/error_logger.module';
import { GroupModule } from './group/group.module';
import { SocketsModule } from './gateway/sockets.module';
import { NotificationModule } from './notification/notification.module';
import { FirebaseModule } from './firebase/firebase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account/entities/account.entity';
import { Group } from './group/entities/group.entity';
import { ErrorLogger } from './common/error_logger/entities/error_logger.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, load: [dbConfig] }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.user'),
        database: configService.get('database.name'),
        password: configService.get('database.password'),
        entities: [Account, Group, ErrorLogger],
        retryAttempts: 2,
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
    NotificationModule,
    AccountModule,
    ErrorLoggerModule,
    GroupModule,
    SocketsModule,
    FirebaseModule,
  ],
})
export class AppModule {}
