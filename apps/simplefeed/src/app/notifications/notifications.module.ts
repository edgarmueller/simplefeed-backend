import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthConfigFactory, AuthModule as AuthCoreModule } from "@simplefeed/auth";
import { ChatModule } from '@simplefeed/chat';
import { NotificationModule as NotificationCoreModule } from '@simplefeed/notification';
import { CommentAddedEventHandler } from './adapters/event-handlers/comment-added.event-handler';
import { FriendRequestAcceptedEventHandler } from './adapters/event-handlers/friend-request-accepted.event-handler';
import { FriendRequestSentEventHandler } from './adapters/event-handlers/friend-request-sent.event-handler';
import { PostCreatedEventHandler } from './adapters/event-handlers/post-created.event-handler';
import { PostLikedEventHandler } from './adapters/event-handlers/post-liked.event-handler';
import { NotificationsController } from './adapters/notifications.controller';
import { NotificationsGateway } from './adapters/notifications.gateway';

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