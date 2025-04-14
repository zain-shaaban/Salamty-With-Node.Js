import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { Account } from './entities/account.entity';
import { OTPService } from 'src/common/transporter/otp.service';
import { SocketsModule } from 'src/gateway/sockets.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), SocketsModule],
  controllers: [AccountController],
  providers: [AccountService, OTPService],
})
export class AccountModule {}
