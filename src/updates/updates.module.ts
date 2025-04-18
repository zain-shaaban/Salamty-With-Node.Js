import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpdatesService } from './updates.service';
import { UpdatesController } from './updates.controller';
import { Update } from './entities/update.entity';
import { Account } from 'src/account/entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Update, Account])],
  controllers: [UpdatesController],
  providers: [UpdatesService],
})
export class UpdatesModule {}