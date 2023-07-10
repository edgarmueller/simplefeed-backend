import { Injectable } from '@nestjs/common'
import { GetNotificationDto } from './dto/get-notification.dto'
import { NotificationsRepository } from './notifications.repository'
import { Notification } from './notification'

@Injectable()
export class NotificationUsecases {
  constructor(readonly notificaitonsRepository: NotificationsRepository) {}

  async findUnviewedNotificationsForUserId(
    userId: string
  ): Promise<GetNotificationDto[]> {
    const notifications = await this.notificaitonsRepository.findManyUnviewedByUserId(userId)
    return notifications.map(GetNotificationDto.fromDomain)
  }

  async createNotification(notification: Notification): Promise<void> {
    await this.notificaitonsRepository.save(notification)
  }
}
