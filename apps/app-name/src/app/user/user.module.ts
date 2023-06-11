import { UserModule as UserCoreModule } from '@kittgen/user';
import { Module } from '@nestjs/common';
import { S3Module } from '../infra/s3/s3.module';
import { UserController } from './user.controller';
import { UserUsecases } from './user.usecases';

@Module({
	controllers: [UserController],
	providers: [UserUsecases],
	imports: [UserCoreModule, S3Module],
	exports: [UserCoreModule]
})
export class UserModule {

}