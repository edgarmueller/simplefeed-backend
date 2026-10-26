import { UserModule as UserCoreModule } from '@simplefeed/user';
import { Module } from '@nestjs/common';
import { UserController } from './adapters/user.controller';

@Module({
	controllers: [UserController],
	providers: [],
	imports: [UserCoreModule],
	exports: [UserCoreModule]
})
export class UserModule {

}