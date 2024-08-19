import { IDomainEvent } from '@simplefeed/shared-ddd';
import { Post } from '../post';

export class PostCreatedEvent implements IDomainEvent {
  public timestamp: Date;
  public post: Post;

  constructor(post: Post) {
    this.timestamp = new Date();
    this.post = post;
  }

  getAggregateId(): string {
    return this.post.id;
  }
}
