import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { FriendsController } from './friends.controller';
import { FriendUsecases } from './friends.usecases';
import { FriendRequestAcceptedHandler } from './friend-request-accepted.event-handler';

@Module({
	controllers: [FriendsController],
	providers: [FriendUsecases, FriendRequestAcceptedHandler],
	imports: [UserModule]
})
export class FriendsModule {

}