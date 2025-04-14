import { Module } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';
import { Account } from 'src/account/entities/account.entity';
import { Group } from 'src/group/entities/group.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpdateSocketGateway } from './update-socket/update-socket.gateway';
import { SocketsService } from './sockets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Group])],
  providers: [SocketsGateway, UpdateSocketGateway, SocketsService],
  exports: [SocketsService, UpdateSocketGateway],
})
export class SocketsModule {}
