import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OTPService {
  private otpStorage: Map<string, { otp: string; expiresAt: number }> =
    new Map();

  private transporter: nodemailer.Transporter;

  constructor() {
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
    const expiresAt = Date.now() + 30 * 60 * 1000;

    this.otpStorage.set(email, { otp, expiresAt });

    const mailOptions = {
      from: '"salamty" <salamty@gmail.com>',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
      html: `<p>Your OTP is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  verifyOTP(email: string, otp: string): boolean {
    const storedOTP = this.otpStorage.get(email);

    if (!storedOTP) {
      return false;
    }

    const { otp: storedOtp, expiresAt } = storedOTP;

    if (storedOtp === otp && Date.now() <= expiresAt) {
      this.otpStorage.delete(email);
      return true;
    }

    return false;
  }
}
