import { UsersRepository, UserNotFoundError } from '@kittgen/user'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { TokenPayload } from '../interfaces/token-payload.interface'
import { AuthConfigKeys } from '../auth.config'
import { AUTH_MODULE_OPTIONS } from '../auth.constants'
import { AuthModuleOptions } from '../interfaces/auth-options.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private logger = new Logger(JwtStrategy.name)

  constructor(
    readonly configService: ConfigService,
    private readonly userRepo: UsersRepository,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          if (options.useCookies) {
            return request?.cookies?.Authentication
          }
          return (
            request?.headers?.authorization
              ?.replace('Bearer', '')
              // spec specifies a Token schema for some reason
              .replace('Token', '')
              .trim()
          )
        },
      ]),
      secretOrKey: configService.get(AuthConfigKeys.AccessTokenSecret),
    })
  }

  async validate(payload: TokenPayload) {
    try {
      return await this.userRepo.findOneByIdOrFail(payload.userId)
    } catch (error) {
      this.logger.error(error)
      if (error instanceof UserNotFoundError) {
        throw new UnauthorizedException()
      }
      throw error
    }
  }
}
