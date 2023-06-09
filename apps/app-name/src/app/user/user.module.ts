import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserUsecases } from './user.usecases';
import { UserModule as UserCoreModule } from '@kittgen/user';
import { FriendRequestsController } from './friend-requests/friend-request.controller';
import { FriendRequestUsecases } from './friend-requests/friend-request.usecases';
import { FriendsController } from './friends/friends.controller';
import { FriendUsecases } from './friends/friends.usecases';
import { FriendRequestAcceptedHandler } from './event-handler/friend-request-accepted.event-handler';

@Module({
	controllers: [UserController, FriendRequestsController, FriendsController],
	providers: [UserUsecases, FriendRequestUsecases, FriendUsecases, FriendRequestAcceptedHandler],
	imports: [UserCoreModule]
})
export class UserModule {

}