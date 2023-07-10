import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSchema } from './adapters/database/notification.schema';
import { NotificationsRepository } from './notifications.repository';
import { NotificationUsecases } from './notifications.usecases';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSchema])
  ],
  controllers: [],
  providers: [NotificationsRepository, NotificationUsecases],
  exports: [NotificationUsecases],
})
export class NotificationModule {}
