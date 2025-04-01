import { Module } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { Account } from 'src/account/entities/account.entity';
import { Group } from 'src/group/entities/group.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Group])],
  providers: [SocketsGateway],
  exports: [SocketsGateway],
})
export class SocketsModule {}