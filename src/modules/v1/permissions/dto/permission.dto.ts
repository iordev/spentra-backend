import { IsNotEmpty, IsString } from 'class-validator';

export class PermissionDto {
  @IsString({ message: 'Permission name must be a string.' })
  @IsNotEmpty({ message: 'Permission name is required.' })
  name: string;

  @IsString({ message: 'Permission description must be a string.' })
  @IsNotEmpty({ message: 'Permission description is required.' })
  description: string;

  @IsString({ message: 'Permission group must be a string.' })
  @IsNotEmpty({ message: 'Permission group is required.' })
  group: string;
}
