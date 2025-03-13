import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
} from 'class-validator';

class coords {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

class location {
  coords: coords;

  @IsNumber()
  @IsNotEmpty()
  time: number;
}

export class SendLocationDto {
  @IsString()
  @IsNotEmpty()
  groupID: string;

  @IsOptional()
  location: location;
}
