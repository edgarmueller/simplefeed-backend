import { IsOptional, IsString } from "class-validator";
import { PaginatedQueryDto } from "../../../infra/paginated-query.dto";

export class PaginatedPostQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsString()
  userId?: string
}