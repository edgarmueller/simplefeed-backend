import { UserRepository, UserNotFoundError } from '@realworld/user';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { AuthConfigKeys } from '../__name@lowercased__.config';
import { AUTH_MODULE_OPTIONS } from '../__name@lowercased__.constants';
import { AuthModuleOptions } from '../interfaces/__name@lowercased__-options.interface';
 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  private logger = new Logger(JwtStrategy.name)

  constructor(
    readonly configService: ConfigService,
    private readonly userRepo: UserRepository,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
        if (options.useCookies) {
          return request?.cookies?.Authentication
        }
        return request?.headers?.authorization?.replace('Bearer', '')
          // spec specifies a Token schema for some reason
          .replace('Token', '').trim()
      }]),
      secretOrKey: configService.get(AuthConfigKeys.AccessTokenSecret)
    });
  }
 
  async validate(payload: TokenPayload) {
    try {
      return await this.userRepo.findOneById(payload.userId);
    } catch (error) {
      this.logger.error(error)
      if (error instanceof UserNotFoundError) {
        throw new UnauthorizedException()
      }
      throw error
    }
  }
}