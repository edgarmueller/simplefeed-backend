import { DynamicModule, Module, Provider } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from '@kittgen/user'
import { AUTH_MODULE_OPTIONS } from './<%= lowercased(name) %>.constants'
import { AuthService } from './auth.service'
import {
  AuthModuleAsyncOptions,
  AuthOptionsFactory,
} from './interfaces/<%= lowercased(name)%>-options.interface'
import { RefreshToken } from './refresh-token.entity'
import { JwtRefreshTokenStrategy as JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { PublicStrategy } from './strategies/public.strategy'

@Module({})
export class AuthModule {
  static registerAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const providers = this.createAsyncProviders(options)
    return {
      module: JwtModule,
      imports: [
        ...options.imports,
        UserModule,
        PassportModule,
        TypeOrmModule.forFeature([RefreshToken]),
        JwtModule.register({
          secret: 'does-not-matter',
        }),
      ],
      providers: [
        ...providers,
        AuthService,
        LocalStrategy,
        JwtStrategy,
        JwtRefreshStrategy,
        PublicStrategy,
      ],
      exports: [AuthService],
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
