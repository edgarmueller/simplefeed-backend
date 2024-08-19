import { IDomainEvent } from '@simplefeed/shared-ddd';
import { Notification } from '../notification';

export class NotificationCreatedEvent implements IDomainEvent {
  public timestamp: Date;
  public notification: Notification;

  constructor(notification: Notification) {
    this.timestamp = new Date();
    this.notification = notification;
  }

  getAggregateId(): string {
    return this.notification.id;
  }
}
