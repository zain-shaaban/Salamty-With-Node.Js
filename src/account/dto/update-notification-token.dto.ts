import { IsString, MaxLength } from 'class-validator';

export class UpdateNotificationTokenDto {
  @IsString()
  @MaxLength(200)
  notificationToken: string;
}
