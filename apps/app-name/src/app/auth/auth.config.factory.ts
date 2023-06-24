import { Injectable } from '@nestjs/common'
import { AuthConfigKeys, AuthOptionsFactory } from '@kittgen/auth'
import { AuthModuleOptions } from '@kittgen/auth'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthConfigFactory implements AuthOptionsFactory {
  constructor(readonly configService: ConfigService) {}

  createAuthOptions(): AuthModuleOptions | Promise<AuthModuleOptions> {
    return {
      useCookies: this.configService.get(AuthConfigKeys.UseCookies),
      accessTokenSecret: this.configService.get(AuthConfigKeys.AccessTokenSecret),
      accessTokenExpirationInSeconds: this.configService.get(
        AuthConfigKeys.AccessTokenExpirationInSeconds
      ),
      refreshTokenSecret: this.configService.get(AuthConfigKeys.RefreshTokenSecret),
      refreshTokenExpirationInSeconds: this.configService.get(
        AuthConfigKeys.RefreshTokenExpirationInSeconds
      ),
    }
  }
}
