import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCountryDto {
  @IsString({ message: 'Country name must be a string.' })
  @IsNotEmpty({ message: 'Country name is required.' })
  name: string;

  @IsString({ message: 'Country code must be a string.' })
  @IsNotEmpty({ message: 'Country code is required.' })
  code: string;
}
