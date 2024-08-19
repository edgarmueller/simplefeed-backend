import { S3Module } from '@simplefeed/s3';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequestRepository } from './friend-request.repository';
import { FriendRequestSchema } from './friend-request.schema';
import { FriendUsecases } from './friends.usecases';
import { ProfileSchema } from "./profile.schema";
import { UsersRepository } from './user.repository';
import { UserSchema } from './user.schema';
import { UserUsecases } from './user.usecases';

@Module({
  imports: [
		S3Module,
		TypeOrmModule.forFeature([UserSchema]),
		TypeOrmModule.forFeature([ProfileSchema]),
		TypeOrmModule.forFeature([FriendRequestSchema]),
		CqrsModule
	],
	controllers: [],
	providers: [UsersRepository, FriendRequestRepository, UserUsecases, FriendUsecases],
	exports: [S3Module, UsersRepository, FriendRequestRepository, UserUsecases, FriendUsecases],
})
export class UserModule {}
