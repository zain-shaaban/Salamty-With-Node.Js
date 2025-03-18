import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as nodemailer from 'nodemailer';
import { Account } from 'src/account/entities/account.entity';
import { logger } from '../error_logger/logger.util';

@Injectable()
export class OTPService {
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
    const account = await this.accountModel.findOne({ where: { email } });
    if (!account) return;

    const mailOptions = {
      from: '"salamty" <salamty@gmail.com>',
      to: email,
      subject: 'Your OTP Code',
      html: `<div dir="rtl" lang="ar" style="margin: 0; padding: 40px 20px; font-family: Tahoma, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background: #FAFCFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      
      <div style="padding: 30px 25px; background-color: #FAFCFF; text-align: center;">
        <h1 style="color: #27304A; margin: 0; font-size: 24px; font-weight: bold;">
          تأكيد الحساب
        </h1>
      </div>
  
      <div style="padding: 35px 25px; text-align: center;">
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          مرحباً ${account.userName}،<br>
          رمز التأكيد الخاص بك هو:
        </p>
        <div style="background: #e8f0fe; padding: 20px; 
                  margin: 0 auto; border-radius: 6px; 
                  text-align: center; font-size: 28px;
                  color: #2a3b66; font-weight: bold;
                  letter-spacing: 2px; max-width: 300px;">
          ${otp}
        </div>
      </div>
  
      <div style="background-color: #00D478; padding: 18px 25px; text-align: center;">
        <div style="color: #ffffff; font-size: 14px; margin: 0; display: flex; justify-content: center; gap: 8px;">
          <span>تطبيق سلامتي</span>
          <span style="opacity: 0.7;">|</span>
          <span>نظام التأكيد الآلي</span>
        </div>
      </div>
    </div>
  </div>`,
    };

    try {
      await Promise.all([
        this.transporter.sendMail(mailOptions),
        account.update({ otp, otpExpiry }),
      ]);
    } catch (error) {
      logger.error(error.message, error.stack);
      return;
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
