import { IsNotEmpty, IsString,  } from 'class-validator';

export class LeaveGroupDto {
  @IsString()
  @IsNotEmpty()
  groupID: string;
}
