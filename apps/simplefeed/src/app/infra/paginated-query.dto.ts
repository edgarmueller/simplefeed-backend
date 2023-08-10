import { Transform } from 'class-transformer';
import { IsOptional, IsPositive, IsString } from 'class-validator';

export class PaginatedQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  page = 1

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsPositive()
  limit = 10
}
