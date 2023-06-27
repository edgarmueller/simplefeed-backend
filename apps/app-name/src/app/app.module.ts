import { Module } from '@nestjs/common';
import { S3Module, S3Schema } from '@kittgen/s3';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infra/database/database.module';
import { DatabaseConfigSchema } from './infra/database/database.config';
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module';
import { authConfig } from '@simplefeed/auth';
import { FriendsModule } from './friends/friends.module';
import { PostModule } from './posts/post.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local'],
      load: [authConfig],
      validationSchema: Joi.object().keys(
        DatabaseConfigSchema
      ).keys(S3Schema)
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    FriendsModule,
    PostModule,
    ChatModule,
    // S3Module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
