import { UserModule as UserCoreModule, UserUsecases } from '@kittgen/user';
import { Module } from '@nestjs/common';
import { ChatModule } from '@kittgen/chat';
import { UserController } from './user.controller';

@Module({
	controllers: [UserController],
	providers: [UserUsecases],
	imports: [UserCoreModule, ChatModule],
	exports: [UserCoreModule]
})
export class UserModule {

}