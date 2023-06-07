import { IDomainEvent } from '@kittgen/shared-ddd';
import { User } from '@kittgen/user';
import { Post } from '../post';

export class PostUnlikedEvent implements IDomainEvent {
  public timestamp: Date;

  constructor(readonly post: Post, readonly unlikedBy: User) {
    this.timestamp = new Date();
  }

  getAggregateId(): string {
    return this.post.id;
  }
}
