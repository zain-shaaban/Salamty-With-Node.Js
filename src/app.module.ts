import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AccountModule } from './account/account.module';
import dbConfig from './config/db.config';
import { JwtModule } from '@nestjs/jwt';
import { ErrorLoggerModule } from './common/error_logger/error_logger.module';
import { GroupModule } from './group/group.module';
import { SocketsModule } from './sockets/sockets.module';
import { NotificationModule } from './notification/notification.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [dbConfig] }),
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.user'),
        database: configService.get('database.name'),
        password: configService.get('database.password'),
        autoLoadModels: true,
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
