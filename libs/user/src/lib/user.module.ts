import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './user.repository';
import { UserSchema } from './user.schema';
import { ProfileSchema } from "./profile.schema" 

@Module({
  imports: [
		TypeOrmModule.forFeature([UserSchema]),
		TypeOrmModule.forFeature([ProfileSchema]),
		CqrsModule
	],
	controllers: [],
	providers: [UsersRepository],
	exports: [UsersRepository],
})
export class UserModule {}
