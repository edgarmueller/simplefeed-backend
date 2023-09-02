import { IDomainEvent } from '@kittgen/shared-ddd';
import { User } from '../user';

export class UserClosedEvent implements IDomainEvent {
  public timestamp: Date;
  public user: User;

  constructor(user: User) {
    this.timestamp = new Date();
    this.user = user;
  }

  getAggregateId(): string {
    return this.user.id;
  }
}
