import { IsString } from 'class-validator';

export class CheckUpdateDto {
  @IsString()
  appVersion: string;

  @IsString()
  infoVersion: string;
}
