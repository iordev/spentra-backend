import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsDateString,
  IsInt,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class RegisterDto {
  // Step 1
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  // Step 2
  @IsString()
  @IsNotEmpty({ message: 'Username is required.' })
  @MinLength(3, { message: 'At least 3 characters.' })
  @MaxLength(20, { message: 'At most 20 characters.' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Only letters, numbers, and underscores allowed.' })
  username: string;

  // Step 3
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'At least 8 characters.' })
  @Matches(/[A-Z]/, { message: 'One uppercase letter required.' })
  @Matches(/\d/, { message: 'One number required.' })
  @Matches(/[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/, { message: 'One special character required.' })
  password: string;

  // Step 4
  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsOptional()
  suffix?: string;

  // Step 5
  @IsEnum(Gender, { message: 'Gender is required.' })
  gender: Gender;

  // Step 6
  @IsDateString({}, { message: 'Birthday is required.' })
  birthDate: string;

  // Step 7
  @IsInt({ message: 'Occupation is required.' })
  occupationId: number;

  // Step 8
  @IsInt({ message: 'Country is required.' })
  countryId: number;

  @IsInt({ message: 'Currency is required.' })
  currencyId: number;

  @IsInt({ message: 'Timezone is required.' })
  timezoneId: number;
}
