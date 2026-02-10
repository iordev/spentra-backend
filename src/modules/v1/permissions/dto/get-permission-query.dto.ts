// src/permissions/dto/get-permission-query.dto.ts
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPermissionQuery {
  @IsOptional()
  @IsIn(['Active', 'Inactive'], {
    message: 'Status must be either Active or Inactive.',
  })
  status?: 'Active' | 'Inactive' = 'Active';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// 🔍 Explanation:
// 1. This is YOUR DTO for validation - it doesn't implement PaginateQuery
// 2. @IsOptional() means the field is not required
// 3. @Type(() => Number) converts string query params to numbers
// 4. status is your custom field that PaginateQuery doesn't know about
