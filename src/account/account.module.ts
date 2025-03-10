import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Account } from './entities/account.entity';
import { OTPService } from 'src/common/transporter/otp.service';

@Module({
  imports: [SequelizeModule.forFeature([Account])],
  controllers: [AccountController],
  providers: [AccountService,OTPService],
})
export class AccountModule {}
