import { AuthModule as AuthCoreModule } from '@kittgen/auth'
import { UserModule as UserCoreModule } from '@kittgen/user'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthConfigFactory } from './auth.config.factory'
import { AuthController } from './auth.controller'
import { AuthUsecases } from './auth.usecases'

@Module({
  imports: [
    UserCoreModule,
    AuthCoreModule.registerAsync({
      imports: [ConfigModule],
      useClass: AuthConfigFactory
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthUsecases],
  exports: [UserCoreModule],
})
export class AuthModule {}
