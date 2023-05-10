import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserUsecases } from './user.usecases';
import { UserModule as UserCoreModule } from '@kittgen/user';
import { FriendRequestsController } from './friend-requests/friend-request.controller';
import { FriendRequestUsecases } from './friend-requests/friend-request.usecases';

@Module({
	controllers: [UserController, FriendRequestsController],
	providers: [UserUsecases, FriendRequestUsecases],
	imports: [UserCoreModule]
})
export class UserModule {

}