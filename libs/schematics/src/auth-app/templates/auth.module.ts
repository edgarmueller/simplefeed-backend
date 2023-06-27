import { Module } from '@nestjs/common'
import { AuthConfigKeys, AuthModule as AuthCoreModule } from '@simplefeed/auth'
import { UserModule as UserCoreModule } from '@simplefeed/user'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthUsecases } from './auth.usecases'

@Module({
  imports: [
    UserCoreModule,
    AuthCoreModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          useCookies: configService.get(AuthConfigKeys.UseCookies),
          accessTokenSecret: configService.get(
            AuthConfigKeys.AccessTokenSecret
          ),
          accessTokenExpirationInSeconds: configService.get(
            AuthConfigKeys.AccessTokenExpirationInSeconds
          ),
          refreshTokenSecret: configService.get(
            AuthConfigKeys.RefreshTokenSecret
          ),
          refreshTokenExpirationInSeconds: configService.get(
            AuthConfigKeys.RefreshTokenExpirationInSeconds
          ),
        }
      },
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthUsecases],
  exports: [UserCoreModule],
})
export class AuthModule {}
