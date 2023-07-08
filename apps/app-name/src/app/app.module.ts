import { S3Module, S3Schema, s3Config } from '@kittgen/s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { authConfig } from '@simplefeed/auth';
import { SearchSchema, searchConfig } from '@simplefeed/search';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FriendsModule } from './friends/friends.module';
import { DatabaseConfigSchema } from './infra/database/database.config';
import { DatabaseModule } from './infra/database/database.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostModule } from './posts/post.module';
import { SearchModule } from './search/search.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.local'],
      load: [authConfig, s3Config, searchConfig],
      validationSchema: Joi.object().keys(
        DatabaseConfigSchema
      ).keys(S3Schema).keys(SearchSchema)
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
