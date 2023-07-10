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

  findManyUnviewedByRecipientAndResourceIds(resourceIds: string[], userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: {
        resourceId: In(resourceIds),
        viewed: false,
        recipientId: userId,
      },
    })
  
	}

	findManyUnviewedByUserId(userId: string) {
		return this.notificationsRepository.find({
      where: {
        viewed: false,
        recipientId: userId,
      },
    })
	}

	async saveMany(notifications: Notification[]) {
		await this.notificationsRepository.save(notifications)
	}
}
