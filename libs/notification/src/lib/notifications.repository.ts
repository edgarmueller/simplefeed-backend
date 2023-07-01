import { Injectable } from '@nestjs/common'
import { Notification } from './notification'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>
  ) {}

  async save(notification: Notification) {
    this.notificationsRepository.save(notification)
  }

  findManyUnreadByRecipientAndResourceIds(resourceIds: string[], userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: {
        resourceId: In(resourceIds),
        isRead: false,
        recipientId: userId,
      },
    })
  
	}

	findManyUnreadByUserId(userId: string) {
		return this.notificationsRepository.find({
      where: {
        isRead: false,
        recipientId: userId,
      },
    })
	}

	async saveMany(notifications: Notification[]) {
		await this.notificationsRepository.save(notifications)
	}
}
