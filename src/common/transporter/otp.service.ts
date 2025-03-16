import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as nodemailer from 'nodemailer';
import { Account } from 'src/account/entities/account.entity';

@Injectable()
export class OTPService {
  private otpStorage: Map<string, { otp: string; expiresAt: number }> =
    new Map();

  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Account) private readonly accountModel: typeof Account,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async sendOTP(email: string): Promise<void> {
    const otp = this.generateOTP();
    const otpExpiry = Date.now() + 1000 * 60 * 30;
    const mailOptions = {
      from: '"salamty" <zeinshaban433@gmail.com>',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
      html: `<p>Your OTP is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
    };

    try {
      await Promise.all([
        this.transporter.sendMail(mailOptions),
        this.accountModel.update({ otp, otpExpiry }, { where: { email } }),
      ]);
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async verifyOTP(email: string, sendOTP: string) {
    const account = await this.accountModel.findOne({ where: { email } });
    if (!account?.otp) {
      return false;
    }
    if (sendOTP == account.otp && Date.now() < account.otpExpiry) {
      await account.update({ otp: null, otpExpiry: null });
      return true;
    }

    return false;
  }
}
