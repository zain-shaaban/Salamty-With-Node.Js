import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateNotificationTokenDto {
  @IsString({ message: 'Notification token must be a string.' })
  @IsNotEmpty({ message: 'Notification token is required.' })
  @MaxLength(200)
  notificationToken: string;
}
