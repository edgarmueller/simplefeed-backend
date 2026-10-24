import { UserModule as UserCoreModule, UserUsecases } from '@simplefeed/user';
import { Module } from '@nestjs/common';
import { ChannelsController } from './adapters/channels.controller';
import { UserController } from './adapters/user.controller';

@Module({
	controllers: [UserController, ChannelsController],
	providers: [UserUsecases],
	imports: [UserCoreModule],
	exports: [UserCoreModule]
})
export class UserModule {

}