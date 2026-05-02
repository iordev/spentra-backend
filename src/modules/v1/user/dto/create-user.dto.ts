import { Gender, Theme } from '@prisma/client';
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

export class CreateUserDto {
  // Required account fields
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsString({ message: 'Full name must be a string.' })
  @IsNotEmpty({ message: 'Full name is required.' })
  @MinLength(2, { message: 'Full name must be at least 2 characters.' })
  @MaxLength(100, { message: 'Full name must be at most 100 characters.' })
  fullName: string;

  @IsString({ message: 'First name must be a string.' })
  @IsNotEmpty({ message: 'First name is required.' })
  @MinLength(2, { message: 'First name must be at least 2 characters.' })
  @MaxLength(50, { message: 'First name must be at most 50 characters.' })
  firstName: string;

  @IsString({ message: 'Last name must be a string.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  @MinLength(2, { message: 'Last name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Last name must be at most 50 characters.' })
  lastName: string;

  @IsInt({ message: 'Role is required.' })
  @IsNotEmpty({ message: 'Role is required.' })
  roleId: number;

  @IsInt({ message: 'Occupation is required.' })
  @IsNotEmpty({ message: 'Occupation is required.' })
  occupationId: number;

  @IsInt({ message: 'Currency is required.' })
  @IsNotEmpty({ message: 'Currency is required.' })
  currencyId: number;

  @IsInt({ message: 'Timezone is required.' })
  @IsNotEmpty({ message: 'Timezone is required.' })
  timezoneId: number;

  @IsInt({ message: 'Country is required.' })
  @IsNotEmpty({ message: 'Country is required.' })
  countryId: number;

  @IsString({ message: 'Username must be a string.' })
  @IsNotEmpty({ message: 'Username is required.' })
  @MinLength(3, { message: 'Username must be at least 3 characters.' })
  @MaxLength(30, { message: 'Username must be at most 30 characters.' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Only letters, numbers, and underscores allowed.' })
  username: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
  @Matches(/\d/, { message: 'Password must contain at least one number.' })
  @Matches(/[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/, {
    message: 'Password must contain at least one special character.',
  })
  password: string;

  // Optional profile fields
  @IsOptional()
  @IsString({ message: 'Middle name must be a string.' })
  @MaxLength(30, { message: 'Middle name must be at most 30 characters.' })
  middleName?: string;

  @IsOptional()
  @IsString({ message: 'Suffix must be a string.' })
  @MaxLength(10, { message: 'Suffix must be at most 10 characters.' })
  suffix?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format.' })
  birthDate?: string;

  @IsEnum(Gender, { message: 'Gender is required.' })
  gender: Gender;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string.' })
  avatarUrl?: string;

  // Optional preferences
  @IsOptional()
  @IsString({ message: 'Date format must be a string.' })
  @MaxLength(20, { message: 'Date format must be at most 20 characters.' })
  dateFormat?: string;

  @IsOptional()
  @IsEnum(Theme, { message: 'Invalid theme.' })
  theme?: Theme;
}
