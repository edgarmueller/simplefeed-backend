import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserUsecases } from './user.usecases';
import { UserModule as UserCoreModule } from '@kittgen/user';

@Module({
	controllers: [UserController],
	providers: [UserUsecases],
	imports: [UserCoreModule]
})
export class UserModule {

}