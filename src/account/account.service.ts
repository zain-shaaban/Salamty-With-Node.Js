import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Account } from './entities/account.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OTPService } from 'src/common/transporter/otp.service';
import { v4 as uuid } from 'uuid';
import { VerifyOTPDto } from './dto/verify.dto';
@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account) private readonly accountModel: typeof Account,
    private readonly jwtService: JwtService,
    private readonly otpService: OTPService,
  ) {}
  async signUp(signUpDto: SignUpDto) {
    const { email, password, username } = signUpDto;
    await this.accountModel.create({
      email,
      username,
      password: bcrypt.hashSync(password),
      confirmed: false,
    });
    this.otpService.sendOTP(email);
    return { email };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.accountModel.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Wrong credentials');
    const auth = bcrypt.compareSync(password, user.password);
    if (!auth) throw new UnauthorizedException('Wrong credentials');
    if (!user.confirmed)
      throw new UnauthorizedException('the email is unconfirmed');
    const authToken = this.jwtService.sign({ userID: user.userID });
    await user.save();
    return { authToken, secretKey: user.secretKey };
  }

  async verifyOTP(verifyOTPDto: VerifyOTPDto) {
    const { email, otp } = verifyOTPDto;
    const verify = this.otpService.verifyOTP(email, otp);
    if (!verify) throw new UnauthorizedException('Invalid otp');
    const user = await this.accountModel.findOne({ where: { email } });
    if (!user) throw new NotFoundException();
    user.confirmed = true;
    user.secretKey = uuid();
    const authToken = this.jwtService.sign({ userID: user.userID });
    await user.save();
    return { authToken, secretKey: user.secretKey };
  }
}
