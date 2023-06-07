import { IDomainEvent } from '@kittgen/shared-ddd';
import { User } from '@kittgen/user';
import { Post } from '../post';
import { Like } from '../like';

export class PostUnlikedEvent implements IDomainEvent {
  public timestamp: Date;

  constructor(readonly post: Post, readonly unlikedBy: User, readonly like: Like) {
    this.timestamp = new Date();
  }

  getAggregateId(): string {
    return this.post.id;
  }
}
