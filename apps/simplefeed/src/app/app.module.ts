import { S3Module, S3Schema, s3Config } from '@simplefeed/s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthConfigSchema, authConfig } from '@simplefeed/auth';
import { SearchSchema, searchConfig } from '@simplefeed/search';
import Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FriendsModule } from './friends/friends.module';
import { DatabaseConfigSchema, databaseConfig } from './infra/database/database.config';
import { DatabaseModule } from './infra/database/database.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostModule } from './posts/post.module';
import { SearchModule } from './search/search.module';
import { UserModule } from './user/user.module';
import redisConfig from './infra/redis.config';
import { APP_FILTER } from '@nestjs/core';
import { EntityNotFoundFilter } from './infra/not-found.exception-filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', `.env.${process.env.PROFILE}}`],
      load: [authConfig, s3Config, searchConfig, databaseConfig, redisConfig],
      validationSchema: Joi.object().keys(
        DatabaseConfigSchema
      ).keys(AuthConfigSchema).keys(S3Schema).keys(SearchSchema)
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    FriendsModule,
    PostModule,
    ChatModule,
    S3Module.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          enabled: configService.get('s3.enabled'),
          bucketName: configService.get('s3.bucketName'),
          endpoint: configService.get('s3.endpoint'),
        }
      },
    }),
    SearchModule,
    NotificationsModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: EntityNotFoundFilter,
    },
  ]
})
export class AppModule { }
