import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCurrencyDto {
  @IsString({ message: 'Currency name must be a string.' })
  @IsNotEmpty({ message: 'Currency name is required.' })
  name: string;

  @IsString({ message: 'Currency code must be a string.' })
  @IsNotEmpty({ message: 'Currency code is required.' })
  code: string;

  @IsString({ message: 'Currency symbol must be a string.' })
  @IsNotEmpty({ message: 'Currency symbol is required.' })
  symbol: string;
}
