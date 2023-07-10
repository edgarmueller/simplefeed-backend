import { IDomainEvent } from '@kittgen/shared-ddd';
import { FriendRequest } from '../friend-request';

export class FriendRequestSent implements IDomainEvent {
  public timestamp: Date;

  constructor(readonly friendRequest: FriendRequest) {
    this.timestamp = new Date();
  }

  getAggregateId(): string {
    return this.friendRequest.id;
  }
}
