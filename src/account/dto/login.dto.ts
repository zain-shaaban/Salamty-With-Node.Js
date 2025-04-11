import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsEmail,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(200)
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6)
  @MaxLength(200)
  password: string;
}
