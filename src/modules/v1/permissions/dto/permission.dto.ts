import { IsNotEmpty, IsString } from 'class-validator';

export class PermissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  group: string;
}
