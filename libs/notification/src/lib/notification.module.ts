import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSchema } from './adapters/database/notification.schema';
import { MessageAddedEventHandler } from './adapters/events/message-added.event-handler';
import { NotificationsRepository } from './notifications.repository';
import { MessagesReadEventHandler } from './adapters/events/messages-read.event-handler';
import { NotificationUsecases } from './notifications.usecases';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSchema])
  ],
  controllers: [],
  providers: [MessageAddedEventHandler, MessagesReadEventHandler, NotificationsRepository, NotificationUsecases],
  exports: [NotificationUsecases],
})
export class NotificationModule {}
