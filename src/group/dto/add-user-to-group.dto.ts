import { IsNotEmpty, IsString } from 'class-validator';

export class AddUserToGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Group id is required.' })
  groupID: string;

  @IsString()
  @IsNotEmpty({ message: 'Secret key is required.' })
  secretKey: string;
}
