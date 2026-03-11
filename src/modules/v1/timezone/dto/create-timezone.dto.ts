import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTimezoneDto {
  @IsString({ message: 'Currency name must be a string.' })
  @IsNotEmpty({ message: 'Currency name is required.' })
  name: string;
}
