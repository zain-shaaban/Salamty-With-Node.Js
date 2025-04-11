import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CoordsDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

class LocationDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CoordsDto)
  coords: CoordsDto;

  @IsNumber()
  @IsNotEmpty()
  time: number;
}

export class SendLocationDto {
  @IsString()
  @IsNotEmpty({ message: 'Group ID is required.' })
  groupID: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
