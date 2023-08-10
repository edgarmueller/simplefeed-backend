import { UserModule as UserCoreModule, UserUsecases } from '@simplefeed/user';
import { Module } from '@nestjs/common';
import { UserController } from './adapters/user.controller';

@Module({
	controllers: [UserController],
	providers: [UserUsecases],
	imports: [UserCoreModule],
	exports: [UserCoreModule]
})
export class UserModule {

}