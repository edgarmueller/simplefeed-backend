import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { FriendsController } from './adapters/friends.controller';
import { FriendRequestsController } from './adapters/friend-request.controller';

@Module({
	controllers: [FriendsController, FriendRequestsController],
	providers: [],
	imports: [UserModule]
})
export class FriendsModule {

}