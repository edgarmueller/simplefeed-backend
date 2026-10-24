import { S3Module } from '@simplefeed/s3';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileSchema } from "./profile.schema";
import { UsersRepository } from './user.repository';
import { SubscriptionUsecases } from './subscriptions.usecases';
import { UserSchema } from './user.schema';
import { UserUsecases } from './user.usecases';

@Module({
  imports: [
		S3Module,
		TypeOrmModule.forFeature([UserSchema]),
		TypeOrmModule.forFeature([ProfileSchema]),
		CqrsModule
	],
	controllers: [],
	providers: [UsersRepository, UserUsecases, SubscriptionUsecases],
	exports: [S3Module, UsersRepository, UserUsecases, SubscriptionUsecases],
})
export class UserModule {}
