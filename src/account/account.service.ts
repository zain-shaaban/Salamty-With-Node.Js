import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Account } from './entities/account.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { OTPService } from 'src/common/transporter/otp.service';
import { v4 as uuid } from 'uuid';
import { VerifyOTPDto } from './dto/verify.dto';
import { UpdateNotificationTokenDto } from './dto/update-notification-token.dto';
import { SendLocationDto } from './dto/send-location.dto';
import { SocketsService } from 'src/gateway/sockets.service';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @Inject() private readonly socketsService: SocketsService,
    private readonly jwtService: JwtService,
    private readonly otpService: OTPService,
  ) {}
  async signUp(signUpDto: SignUpDto): Promise<null> {
    const { email, password, userName } = signUpDto;
    await this.accountRepository.insert({
      email,
      userName,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync()),
      confirmed: false,
    });
    this.otpService.sendOTP(email);
    return null;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ authToken: string; userName: string }> {
    const { email, password } = loginDto;
    const user = await this.accountRepository.findOneBy({ email });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const auth = bcrypt.compareSync(password, user.password);
    if (!auth) throw new UnauthorizedException('Invalid email or password');

    if (!user.confirmed)
      throw new UnauthorizedException('The email is unconfirmed');

    const authToken = this.jwtService.sign({
      userID: user.userID,
      userName: user.userName,
    });

    return { authToken, userName: user.userName };
  }

  async verifyOTP(
    verifyOTPDto: VerifyOTPDto,
  ): Promise<{ authToken: string; secretKey: string }> {
    const { email, otp } = verifyOTPDto;
    const isOtpValid = await this.otpService.verifyOTP(email, otp);
    if (!isOtpValid.status) throw new UnauthorizedException('Invalid OTP');
    const authToken = this.jwtService.sign({
      userID: isOtpValid.data.userID,
      userName: isOtpValid.data.userName,
    });
    return { authToken, secretKey: isOtpValid.data.secretKey };
  }

  async regenerate(userID: string): Promise<{ secretKey: string }> {
    const user = await this.accountRepository.findOneBy({ userID });
    if (!user) throw new NotFoundException('User not found');
    user.secretKey = uuid();
    await this.accountRepository.save(user);
    return { secretKey: user.secretKey };
  }

  async updateNotificationToken(
    userID: string,
    updateNotificationTokenDto: UpdateNotificationTokenDto,
  ): Promise<null> {
    const { notificationToken } = updateNotificationTokenDto;
    await this.accountRepository.update({ userID }, { notificationToken });
    return null;
  }

  async sendNewLocation(
    sendLocationDto: SendLocationDto,
    userID: string,
  ): Promise<null> {
    const { groupID, location } = sendLocationDto;
    const group = this.socketsService.allGroups.find((group) => group.groupID === groupID);
    if (!group)
      throw new NotFoundException(`Group with id ${groupID} not found`);
    const userInGroup = group.members.find((user) => user.userID === userID);
    if (!userInGroup)
      throw new NotFoundException(
        `User with id ${userID} not found in group ${groupID}`,
      );

    userInGroup.location = location;
    userInGroup.notificationSent = false;
    userInGroup.offline = false;

    if (userInGroup.sos) userInGroup.path.push(location);
    // userInGroup.location.time = oneUser.location.time * 1000;
    this.socketsService.sendNewLocation(
      groupID,
      userID,
      location,
      userInGroup.sos,
    );
    return null;
  }

  async resetOTP(resendOtpDto: ResendOtpDto): Promise<null> {
    const { email } = resendOtpDto;
    this.otpService.sendOTP(email);
    return null;
  }
}
