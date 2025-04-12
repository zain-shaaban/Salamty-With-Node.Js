import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Group id is required.' })
  groupID: string;
}
