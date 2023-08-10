import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginatedQueryDto } from './paginated-query.dto';

@Injectable()
export class PaginatedQueryPipe implements PipeTransform {
  async transform(value: unknown) {
    const paginationQueryDto = plainToClass(PaginatedQueryDto, value);
    const errors = await validate(paginationQueryDto);

    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }

    const { limit = 10, page = 0 } = paginationQueryDto;
    return { limit, page };
  }
}
