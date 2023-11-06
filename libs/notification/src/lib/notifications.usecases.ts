import { Injectable } from '@nestjs/common'
import { NotificationsRepository } from './notifications.repository'
import { Notification } from './notification'

@Injectable()
export class NotificationUsecases {
  constructor(readonly notificaitonsRepository: NotificationsRepository) {}

  async findUnviewedNotificationsForUserId(
    userId: string
  ): Promise<Notification[]> {
    const notifications = await this.notificaitonsRepository.findManyUnviewedByUserId(userId)
    return notifications
  }

  async createNotification(notification: Notification): Promise<void> {
    await this.notificaitonsRepository.save(notification)
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificaitonsRepository.findOneById(notificationId)
    notification.markAsRead()
    await this.notificaitonsRepository.save(notification)
    return notification
  }
}
