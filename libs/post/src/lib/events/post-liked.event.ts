import { IDomainEvent } from '@kittgen/shared-ddd';
import { User } from '@simplefeed/user';
import { Post } from '../post';

export class PostLikedEvent implements IDomainEvent {
  public timestamp: Date;

  constructor(readonly post: Post, readonly likedBy: User) {
    this.timestamp = new Date();
  }

  getAggregateId(): string {
    return this.post.id;
  }
}
