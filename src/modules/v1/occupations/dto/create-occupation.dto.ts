import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOccupationDto {
  @IsString({ message: 'Occupation name must be a string.' })
  @IsNotEmpty({ message: 'Occupation name is required.' })
  name: string;
}
