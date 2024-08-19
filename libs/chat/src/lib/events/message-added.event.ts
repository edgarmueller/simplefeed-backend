import { IDomainEvent } from '@simplefeed/shared-ddd';
import { Conversation } from '../conversation';
import { Message } from '../message';

export class MessageAddedEvent implements IDomainEvent {
  public timestamp: Date;

  constructor(readonly conversation: Conversation, readonly message: Message) {
    this.timestamp = new Date();
  }

  getAggregateId(): string {
    return this.conversation.id;
  }
}
