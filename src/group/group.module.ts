import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { Group } from './entities/group.entity';
import { Account } from 'src/account/entities/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpdateSocketModule } from 'src/sockets/update-socket/update-socket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Account]), UpdateSocketModule],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
