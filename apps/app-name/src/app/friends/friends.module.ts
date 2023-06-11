import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { FriendRequestAcceptedHandler } from './event-handlers/friend-request-accepted.event-handler';
import { FriendsController } from './adapters/friends.controller';
import { FriendRequestsController } from './adapters/friend-request.controller';
import { FriendUsecases } from './usecases/friends.usecases';
import { FriendRequestUsecases } from './usecases/friend-request.usecases';

@Module({
	controllers: [FriendsController, FriendRequestsController],
	providers: [FriendUsecases, FriendRequestUsecases, FriendRequestAcceptedHandler],
	imports: [UserModule]
})
export class FriendsModule {

}