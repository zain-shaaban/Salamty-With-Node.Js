import { Module } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { SequelizeModule } from '@nestjs/sequelize';
import { Account } from 'src/account/entities/account.entity';
import { Group } from 'src/group/entities/group.entity';

@Module({
  imports: [SequelizeModule.forFeature([Account, Group])],
  providers: [SocketsGateway],
  exports: [SocketsGateway],
})
export class SocketsModule {}
