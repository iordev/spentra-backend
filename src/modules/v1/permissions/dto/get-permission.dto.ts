import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPermissionDto {
  @IsString({ message: 'Permission name must be a string.' })
  @IsNotEmpty({ message: 'Permission name is required.' })
  @IsIn(['Active', 'Inactive'], { message: 'Status must be either Active or Inactive.' })
  status: 'Active' | 'Inactive' = 'Active';

  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number.' })
  @Min(1, { message: 'Page must be at least 1.' })
  page: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number.' })
  @Min(1, { message: 'Limit must be at least 1.' })
  @Max(100, { message: 'Limit must not exceed 100.' })
  limit: number;

  @IsOptional()
  @IsString({ message: 'Search must be a string.' })
  search?: string;

  @IsOptional()
  @IsIn(['updatedAt', 'group'], { message: 'SortBy must be either updatedAt or group.' })
  @IsString({ message: 'SortBy must be a string.' })
  sortBy?: 'updatedAt' | 'group' = 'updatedAt';

  @IsOptional()
  @IsString({ message: 'SortOrder must be a string.' })
  @IsIn(['asc', 'desc'], { message: 'SortOrder must be either asc or desc.' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
