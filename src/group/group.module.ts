import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Group } from './entities/group.entity';
import { Account } from 'src/account/entities/account.entity';

@Module({
  imports: [SequelizeModule.forFeature([Group,Account])],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}
