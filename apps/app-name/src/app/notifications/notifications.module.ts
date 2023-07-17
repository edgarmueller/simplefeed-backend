import { Module } from '@nestjs/common';
import { AuthModule as AuthCoreModule } from "@simplefeed/auth";
import { ConfigModule } from '@nestjs/config';
import { NotificationModule as NotificationCoreModule } from '@simplefeed/notification';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './adapters/notifications.gateway';
import { AuthConfigFactory } from '../auth/auth.config.factory';
import { FriendRequestSentEventHandler } from './adapters/friend-request-sent.event-handler';
import { PostLikedEventHandler } from './adapters/post-liked.event-handler';
import { CommentAddedEventHandler } from './adapters/comment-added.event-handler';

const EVENT_HANDLERS = [
	FriendRequestSentEventHandler,
	PostLikedEventHandler,
	CommentAddedEventHandler
]

@Module({
	imports: [ConfigModule, NotificationCoreModule,
    AuthCoreModule.registerAsync({
      imports: [ConfigModule],
			useClass: AuthConfigFactory,
    }),
	],
	controllers: [NotificationsController],
	providers: [NotificationsGateway, FriendRequestSentEventHandler, ...EVENT_HANDLERS],
	exports: []
})
export class NotificationsModule {}