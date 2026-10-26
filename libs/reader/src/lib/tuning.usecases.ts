import { ForbiddenException, Injectable } from '@nestjs/common'
import { ReaderRepository } from './reader.repository'
import { Subscription } from './subscription'
import { TuningMessage } from './tuning-message'

const MAX_MESSAGE_LENGTH = 2000

/** The reader's chat with a channel; the worker answers and applies what they ask for. */
@Injectable()
export class TuningUsecases {
  constructor(private readonly repository: ReaderRepository) {}

  private async subscriptionOf(userId: string, subscriptionId: string): Promise<Subscription> {
    const subscription = await this.repository.findSubscriptionOrFail(subscriptionId)
    if (subscription.userId !== userId) {
      throw new ForbiddenException()
    }
    return subscription
  }

  async messages(userId: string, subscriptionId: string): Promise<TuningMessage[]> {
    const subscription = await this.subscriptionOf(userId, subscriptionId)
    return this.repository.findMessages(subscription.id)
  }

  async send(userId: string, subscriptionId: string, content: string): Promise<TuningMessage> {
    const subscription = await this.subscriptionOf(userId, subscriptionId)
    return this.repository.saveMessage(
      TuningMessage.create({ subscription, author: 'reader', content: content.trim().slice(0, MAX_MESSAGE_LENGTH), answered: false })
    )
  }
}
