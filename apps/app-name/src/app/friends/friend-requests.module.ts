import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { FriendRequestsController } from './friend-request.controller';
import { FriendRequestUsecases } from './friend-request.usecases';

@Module({
	controllers: [FriendRequestsController],
	providers: [FriendRequestUsecases],
	imports: [UserModule]
})
export class FriendRequestsModule {

}