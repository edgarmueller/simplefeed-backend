import { Injectable } from '@nestjs/common'
import { GetNotificationDto } from './dto/get-notification.dto'
import { NotificationsRepository } from './notifications.repository'

@Injectable()
export class NotificationUsecases {
  constructor(readonly notificaitonsRepository: NotificationsRepository) {}

  async findUnreadNotificationsForUserId(
    userId: string
  ): Promise<GetNotificationDto[]> {
    const notifications = await this.notificaitonsRepository.findManyUnreadByUserId(userId)
    return notifications.map((notification) => ({
      id: notification.id,
      recipientId: notification.recipientId,
      resourceId: notification.resourceId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    }))
  }
}
