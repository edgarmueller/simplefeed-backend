import { IDomainEvent } from '@kittgen/shared-ddd';
import { Post } from '../post';
import { Comment } from '../comment';

export class CommentAddedEvent implements IDomainEvent {
  public timestamp: Date
  public post: Post
	public comment: Comment

  constructor(post: Post, comment: Comment) {
    this.timestamp = new Date();
    this.post = post;
		this.comment = comment;
  }

	getAggregateId(): string {
		throw this.post.id;
	}
}