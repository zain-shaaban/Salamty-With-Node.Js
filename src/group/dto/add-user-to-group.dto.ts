import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class AddUserToGroupDto {
  @IsString()
  @IsNotEmpty()
  groupID: string;

  @IsString()
  @IsNotEmpty()
  secretKey: string;
}
