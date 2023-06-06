import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserUsecases } from './user.usecases';
import { UserModule as UserCoreModule } from '@kittgen/user';
import { FriendRequestsController } from './friend-requests/friend-request.controller';
import { FriendRequestUsecases } from './friend-requests/friend-request.usecases';
import { FriendsController } from './friends/friends.controller';
import { FriendUsecases } from './friends/friends.usecases';

@Module({
	controllers: [UserController, FriendRequestsController, FriendsController],
	providers: [UserUsecases, FriendRequestUsecases, FriendUsecases],
	imports: [UserCoreModule]
})
export class UserModule {

}