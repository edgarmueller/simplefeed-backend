import { UserModule as UserCoreModule } from '@simplefeed/user';
import { Module } from '@nestjs/common';
import { ChannelsController } from './adapters/channels.controller';
import { UserController } from './adapters/user.controller';

@Module({
	controllers: [UserController, ChannelsController],
	providers: [],
	imports: [UserCoreModule],
	exports: [UserCoreModule]
})
export class UserModule {

}