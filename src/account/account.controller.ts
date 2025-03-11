import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { asyncHandler } from 'src/common/utils/async-handler';
import { VerifyOTPDto } from './dto/verify.dto';
import { AccountAuthGuard } from 'src/common/guards/account.guard';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return await asyncHandler(this.accountService.signUp(signUpDto));
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await asyncHandler(this.accountService.login(loginDto));
  }

  @Post('verify')
  async verifyOTP(@Body() verifyOTPDto: VerifyOTPDto) {
    return await asyncHandler(this.accountService.verifyOTP(verifyOTPDto));
  }

  @UseGuards(AccountAuthGuard)
  @Patch('regenerate')
  async regenerate(@Req() req) {
    return await asyncHandler(this.accountService.regenerate(req.user.userID));
  }
}
