import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository, UserNotFoundError, User } from '@realworld/user'
import { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { AuthService } from '../__name@lowercased__.service';
import { AuthConfigKeys } from '../__name@lowercased__.config';
import { AUTH_MODULE_OPTIONS } from '../__name@lowercased__.constants';
import { AuthModuleOptions } from '../interfaces/__name@lowercased__-options.interface';
 
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token'
) {
  constructor(
    readonly configService: ConfigService,
    private readonly authService: AuthService,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions,
    private readonly userRepo: UserRepository
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
        if (options.useCookies) {
          return request?.cookies?.Refresh;
        }
        return request?.body?.refreshToken
      }]),
      secretOrKey: configService.get(AuthConfigKeys.RefreshTokenSecret),
      passReqToCallback: true,
    });
  }
 
  async validate(request: Request, payload: TokenPayload): Promise<User> {
    const refreshToken = this.options.useCookies ? request.cookies?.Refresh : request.body?.refreshToken
    const isMatch = await this.authService.verifyRefreshTokenMatches(
      refreshToken,
      payload.userId
    )
    if (isMatch) {
      try {
        return await this.userRepo.findOneById(payload.userId);
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          throw new UnauthorizedException()
        }
        throw error
      }
    } 
    throw new UnauthorizedException()
  }
}