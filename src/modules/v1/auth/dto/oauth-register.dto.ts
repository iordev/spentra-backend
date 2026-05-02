import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class OAuthRegisterDto {
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required.' })
  @MinLength(3, { message: 'Username must be at least 3 characters.' })
  @MaxLength(30, { message: 'Username must be at most 30 characters.' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Only letters, numbers, and underscores allowed.' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsEnum(Gender, { message: 'Gender is required.' })
  gender: Gender;

  @IsDateString({}, { message: 'Invalid date format.' })
  birthDate: string;

  @IsInt({ message: 'Occupation is required.' })
  occupationId: number;

  @IsInt({ message: 'Country is required.' })
  countryId: number;

  @IsInt({ message: 'Currency is required.' })
  currencyId: number;

  @IsInt({ message: 'Timezone is required.' })
  timezoneId: number;

  @IsString()
  @IsNotEmpty({ message: 'Provider is required.' })
  provider: string;
}
