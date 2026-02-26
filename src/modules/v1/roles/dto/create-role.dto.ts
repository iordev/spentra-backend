import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'Role name must be a string.' })
  @IsNotEmpty({ message: 'Role name is required.' })
  name: string;

  @IsString({ message: 'Role description must be a string.' })
  @IsNotEmpty({ message: 'Role description is required.' })
  description: string;

  @IsString({ message: 'Role group must be a string.' })
  @IsNotEmpty({ message: 'Role group is required.' })
  group: string;
}
