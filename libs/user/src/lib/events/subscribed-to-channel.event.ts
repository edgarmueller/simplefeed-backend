import { IDomainEvent } from '@simplefeed/shared-ddd';
import { User } from '../user';

export class SubscribedToChannel implements IDomainEvent {
  public timestamp: Date;

  constructor(readonly subscriber: User, readonly channel: User) {
    this.timestamp = new Date();
  }

  getAggregateId(): string {
    return this.subscriber.id;
  }
}
