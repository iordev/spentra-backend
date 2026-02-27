import { ArrayUnique, IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'Role name must be a string.' })
  @IsNotEmpty({ message: 'Role name is required.' })
  name: string;

  @IsString({ message: 'Role description must be a string.' })
  @IsNotEmpty({ message: 'Role description is required.' })
  description: string;

  @IsArray({ message: 'Permissions must be an array.' })
  @IsNumber({}, { each: true, message: 'Each permission ID must be a number.' })
  @ArrayUnique({ message: 'Permission IDs must be unique.' })
  permissions?: number[];
}
