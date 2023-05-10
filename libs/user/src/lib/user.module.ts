import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './user.repository';
import { UserSchema } from './user.schema';
import { ProfileSchema } from "./profile.schema" 
import { FriendRequestSchema } from './friend-request.schema';
import { FriendRequestRepository } from './friend-request.repository';

@Module({
  imports: [
		TypeOrmModule.forFeature([UserSchema]),
		TypeOrmModule.forFeature([ProfileSchema]),
		TypeOrmModule.forFeature([FriendRequestSchema]),
		CqrsModule
	],
	controllers: [],
	providers: [UsersRepository, FriendRequestRepository],
	exports: [UsersRepository, FriendRequestRepository],
})
export class UserModule {}
