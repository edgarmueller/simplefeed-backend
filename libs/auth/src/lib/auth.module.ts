import { DynamicModule, Module, Provider } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from '@simplefeed/user'
import { AUTH_MODULE_OPTIONS } from './auth.constants'
import { AuthService } from './auth.service'
import {
  AuthModuleAsyncOptions,
  AuthOptionsFactory,
} from './interfaces/auth-options.interface'
import { RefreshToken } from './refresh-token.entity'
import { JwtRefreshTokenStrategy as JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { PublicStrategy } from './strategies/public.strategy'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthConfigKeys } from './auth.config'
import { AuthUsecases } from './auth.usecases'

@Module({})
export class AuthModule {
  static registerAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const providers = this.createAsyncProviders(options)
    return {
      module: JwtModule,
      imports: [
        ...(options?.imports || []),
        UserModule,
        PassportModule,
        TypeOrmModule.forFeature([RefreshToken]),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get(AuthConfigKeys.AccessTokenSecret)
          })
        }),
      ],
      providers: [
        ...providers,
        AuthService,
        LocalStrategy,
        JwtStrategy,
        JwtRefreshStrategy,
        PublicStrategy,
        AuthUsecases
      ],
      exports: [AuthService, AuthUsecases],
    }
  }

  private static createAsyncProviders(
    options: AuthModuleAsyncOptions
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ]
  }

  private static createAsyncOptionsProvider(
    options: AuthModuleAsyncOptions
  ): Provider {
    // brudi
    if (options.useFactory) {
      return {
        provide: AUTH_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }
    return {
      provide: AUTH_MODULE_OPTIONS,
      useFactory: async (optionsFactory: AuthOptionsFactory) =>
        await optionsFactory.createAuthOptions(),
      inject: [options.useExisting || options.useClass],
    }
  }
}
