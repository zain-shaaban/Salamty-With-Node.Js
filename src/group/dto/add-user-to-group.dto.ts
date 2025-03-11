import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class AddUserToGroupDto {
  @IsNumber()
  @IsNotEmpty()
  groupID: number;

  @IsString()
  @IsNotEmpty()
  secretKey: string;
}
