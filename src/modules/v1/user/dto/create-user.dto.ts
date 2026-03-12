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
} from 'class-validator';

export class CreateUserDto {
  // Required account fields
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsInt()
  @IsNotEmpty()
  roleId: number;

  @IsInt()
  @IsNotEmpty()
  occupationId: number;

  @IsNotEmpty()
  @IsInt()
  currencyId?: number;

  @IsNotEmpty()
  @IsInt()
  timezoneId?: number;

  @IsNotEmpty()
  @IsInt()
  countryId?: number;

  // Optional account fields
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  // Optional profile fields
  @IsOptional()
  @IsString()
  @MaxLength(30)
  middleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  suffix?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  // Optional preferences
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dateFormat?: string;

  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;
}
