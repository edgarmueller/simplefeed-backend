
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }
    // "value" is an object containing the file's attributes and metadata
    const fiveMb = 5 * 1024 * 1024;
    if (value.size > fiveMb) {
      throw new BadRequestException("file too big")
    }
    return value;
  }
}