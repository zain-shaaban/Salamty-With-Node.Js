import { Module } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { SequelizeModule } from '@nestjs/sequelize';
import { Account } from 'src/account/entities/account.entity';

@Module({
  imports: [SequelizeModule.forFeature([Account])],
  providers: [SocketsGateway],
  exports: [SocketsGateway],
})
export class SocketsModule {}
