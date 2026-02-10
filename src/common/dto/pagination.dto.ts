import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum Status {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class PaginationDto {
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsOptional()
  search?: string;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  order?: 'asc' | 'desc';

  @IsEnum(Status, { message: 'status must be either Active or Inactive' })
  status!: Status; // ❗ required
}
