import { IDomainEvent } from '@simplefeed/shared-ddd';
import { User } from '@simplefeed/user';
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
