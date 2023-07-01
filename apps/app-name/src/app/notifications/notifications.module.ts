import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule as NotificationCoreModule } from '@simplefeed/notification';
import { NotificationsController } from './notifications.controller';

@Module({
	imports: [ConfigModule, NotificationCoreModule,],
	controllers: [NotificationsController],
	providers: [],
	exports: []
})
export class NotificationsModule {}