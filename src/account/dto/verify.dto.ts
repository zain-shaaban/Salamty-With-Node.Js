import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEmail,
} from 'class-validator';

export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  otp: string;
}
