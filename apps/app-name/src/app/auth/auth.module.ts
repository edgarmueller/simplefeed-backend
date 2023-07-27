import { AuthModule as AuthCoreModule, AuthConfigFactory } from '@simplefeed/auth'
import { UserModule as UserCoreModule } from '@simplefeed/user'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthUsecases } from '../../../../../libs/auth/src/lib/auth.usecases'

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
