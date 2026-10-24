import { BadRequestException } from '@nestjs/common';

export class NotAChannelError extends BadRequestException {
  constructor(username: string) {
    super(`${username} is not a channel`);
  }
}
