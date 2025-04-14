import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { Group } from './entities/group.entity';
import { Account } from 'src/account/entities/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketsModule } from 'src/gateway/sockets.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Account]), SocketsModule],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
