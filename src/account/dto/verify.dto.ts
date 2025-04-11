import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
  MinLength,
} from 'class-validator';

export class VerifyOTPDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(200)
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required.' })
  @MaxLength(6, { message: 'OTP code must be exactly 6 digits' })
  @MinLength(6, { message: 'OTP code must be exactly 6 digits' })
  otp: string;
}
