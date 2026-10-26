import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { timingSafeEqual } from 'crypto'

export const WORKER_KEY_HEADER = 'x-worker-key'

/**
 * Lets only the channels worker, which knows `WORKER_API_KEY`, use the worker
 * API. Without the variable, the worker API is closed.
 */
@Injectable()
export class WorkerKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('WORKER_API_KEY')
    const provided = context.switchToHttp().getRequest<Request>().header(WORKER_KEY_HEADER)
    if (!expected || !provided || !sameSecret(expected, provided)) {
      throw new ForbiddenException('Only the channels worker may do this')
    }
    return true
  }
}

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
