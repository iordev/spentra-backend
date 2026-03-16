import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // accepts email or username

  @IsString()
  @IsNotEmpty()
  password: string;
}
