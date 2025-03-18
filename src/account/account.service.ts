import {
  Inject,
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
import { UpdateNotificationTokenDto } from './dto/update-notification-token.dto';
import { SendLocationDto } from './dto/send-location.dto';
import { allGroups, SocketsGateway } from 'src/sockets/sockets.gateway';
import { ResendOtpDto } from './dto/resend-otp.dto';
@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account) private readonly accountModel: typeof Account,
    @Inject() private readonly socketsGateway: SocketsGateway,
    private readonly jwtService: JwtService,
    private readonly otpService: OTPService,
  ) {}
  async signUp(signUpDto: SignUpDto) {
    const { email, password, userName } = signUpDto;
    await this.accountModel.create({
      email,
      userName,
      password: bcrypt.hashSync(password),
      confirmed: false,
    });
    this.otpService.sendOTP(email);
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.accountModel.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Wrong credentials');
    const auth = bcrypt.compareSync(password, user.password);
    if (!auth) throw new UnauthorizedException('Wrong credentials');
    if (!user.confirmed)
      throw new UnauthorizedException('the email is unconfirmed');
    const authToken = this.jwtService.sign({
      userID: user.userID,
      userName: user.userName,
    });
    await user.save();
    return { authToken, userName: user.userName };
  }

  async verifyOTP(verifyOTPDto: VerifyOTPDto) {
    const { email, otp } = verifyOTPDto;
    const verify = await this.otpService.verifyOTP(email, otp);
    if (!verify) throw new UnauthorizedException('Invalid otp');
    const user = await this.accountModel.findOne({ where: { email } });
    if (!user) throw new NotFoundException();
    user.confirmed = true;
    user.secretKey = uuid();
    const authToken = this.jwtService.sign({
      userID: user.userID,
      userName: user.userName,
    });
    await user.save();
    return { authToken, secretKey: user.secretKey };
  }

  async regenerate(userID: number) {
    const user = await this.accountModel.findByPk(userID);
    if (!user) throw new NotFoundException();
    user.secretKey = uuid();
    await user.save();
    return { secretKey: user.secretKey };
  }

  async updateNotificationToken(
    updateNotificationTokenDto: UpdateNotificationTokenDto,
    userID: number,
  ) {
    const { notificationToken } = updateNotificationTokenDto;
    await this.accountModel.update(
      { notificationToken },
      { where: { userID } },
    );
    return null;
  }

  async sendNewLocation(sendLocationDto: SendLocationDto, userID: number) {
    const { groupID, location } = sendLocationDto;
    const group = allGroups.find((group) => group.groupID == groupID);
    if (!group) throw new NotFoundException();
    const oneUser = group.members.find((user) => user.userID == userID);
    if (!oneUser) throw new NotFoundException();
    oneUser.location = location;
    oneUser.notificationSent = false;
    oneUser.offline = false;
    //oneUser.location.time = oneUser.location.time * 1000;
    this.socketsGateway.sendNewLocation(groupID, userID, location);
    return null;
  }

  async resetOTP(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    this.otpService.sendOTP(email);
    return null;
  }
}
