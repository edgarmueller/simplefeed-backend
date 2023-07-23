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
import { PostCreatedEventHandler } from './adapters/post-created.event-handler';
import { FriendRequestAcceptedEventHandler } from './adapters/friend-request-accepted.event-handler';
import { ChatModule } from '@simplefeed/chat';

const EVENT_HANDLERS = [
	FriendRequestSentEventHandler,
	PostLikedEventHandler,
	CommentAddedEventHandler,
	PostCreatedEventHandler,
	FriendRequestAcceptedEventHandler
]

@Module({
	imports: [
		ConfigModule, 
		NotificationCoreModule,
		ChatModule,
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