import { S3Module, S3Schema, s3Config } from '@kittgen/s3';
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
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('s3.enabled'),
        accessKeyId: configService.get('s3.accessKeyId'),
        secretAccessKey: configService.get('s3.secretAccessKey'),
        region: configService.get('s3.region'),
        host: configService.get('s3.host'),
        href: configService.get('s3.href'),
        port: configService.get('s3.port'),
        hostname: configService.get('s3.hostname'),
        protocol: configService.get('s3.protocol'),
      }),
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
