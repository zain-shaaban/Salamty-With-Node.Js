import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Account } from 'src/account/entities/account.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { Group } from 'src/group/entities/group.entity';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([Account,Group])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
