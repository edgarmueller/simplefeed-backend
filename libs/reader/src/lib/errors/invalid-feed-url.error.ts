import { BadRequestException } from '@nestjs/common'

export class InvalidFeedUrlError extends BadRequestException {
  constructor(url: string) {
    super(`"${url}" is not a web address`)
  }
}
