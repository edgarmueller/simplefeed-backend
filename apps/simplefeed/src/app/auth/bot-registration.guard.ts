import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { timingSafeEqual } from 'crypto'

export const BOT_REGISTRATION_KEY_HEADER = 'x-bot-registration-key'

/**
 * Only callers that know `BOT_REGISTRATION_KEY` (the channels worker) may
 * create bot accounts. Without the variable, bot registration is disabled.
 */
@Injectable()
export class BotRegistrationGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('BOT_REGISTRATION_KEY')
    const provided = context.switchToHttp().getRequest<Request>().header(BOT_REGISTRATION_KEY_HEADER)
    if (!expected || !provided || !sameSecret(expected, provided)) {
      throw new ForbiddenException('Bot registration is not allowed')
    }
    return true
  }
}

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
