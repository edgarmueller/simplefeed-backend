import { IDomainEvent } from '@kittgen/shared-ddd'
import { Message } from '../message'

export class MessagesReadEvent implements IDomainEvent {
  public timestamp: Date

  constructor(
    readonly messages: Message[],
    readonly conversationId: string,
    readonly userId: string
  ) {
    this.timestamp = new Date()
  }

  getAggregateId(): string {
    return this.conversationId
  }
}
