import { IDomainEvent } from '@kittgen/shared-ddd';
import { Conversation } from '../conversation';

export class ConversationAddedEvent implements IDomainEvent {
  public timestamp: Date;

  constructor(readonly conversation: Conversation) {
    this.timestamp = new Date();
  }

  getAggregateId(): string {
    return this.conversation.id;
  }
}
