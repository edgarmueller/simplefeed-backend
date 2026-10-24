import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthConfigFactory, AuthModule as AuthCoreModule } from "@simplefeed/auth";
import { ChatModule } from '@simplefeed/chat';
import { NotificationModule as NotificationCoreModule } from '@simplefeed/notification';
import { CommentAddedEventHandler } from './adapters/event-handlers/comment-added.event-handler';
import { PostCreatedEventHandler } from './adapters/event-handlers/post-created.event-handler';
import { PostLikedEventHandler } from './adapters/event-handlers/post-liked.event-handler';
import { NotificationsGateway } from './adapters/notifications.gateway';

const EVENT_HANDLERS = [
	PostLikedEventHandler,
	CommentAddedEventHandler,
	PostCreatedEventHandler
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
	controllers: [],
	providers: [NotificationsGateway, ...EVENT_HANDLERS],
	exports: []
})
export class NotificationsModule {}