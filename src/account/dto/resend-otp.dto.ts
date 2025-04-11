import { IsNotEmpty, MaxLength, IsEmail } from 'class-validator';

export class ResendOtpDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(200)
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  email: string;
}
