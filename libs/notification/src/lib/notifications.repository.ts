import { Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional'
import { DomainEvents } from '@kittgen/shared-ddd'
import { Notification } from './notification'

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async save(notification: Notification) {
    this.notificationsRepository.save(notification)
    runOnTransactionCommit(() => {
      DomainEvents.dispatchEventsForAggregate(notification.id, this.publisher)
    });
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

  findOneById(notificationId: any) {
    return this.notificationsRepository.findOne({
      where: {
        id: notificationId,
      },
    })  
  }
}
