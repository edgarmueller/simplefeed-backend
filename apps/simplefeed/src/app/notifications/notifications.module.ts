import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthConfigFactory, AuthModule as AuthCoreModule } from "@simplefeed/auth";
import { ChatModule } from '@simplefeed/chat';
import { NotificationModule as NotificationCoreModule } from '@simplefeed/notification';
import { PostCreatedEventHandler } from './adapters/event-handlers/post-created.event-handler';
import { NotificationsGateway } from './adapters/notifications.gateway';

const EVENT_HANDLERS = [
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