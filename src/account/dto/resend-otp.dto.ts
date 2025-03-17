import { IsNotEmpty, IsString, MaxLength, IsEmail } from 'class-validator';

export class ResendOtpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsEmail()
  email: string;
}
