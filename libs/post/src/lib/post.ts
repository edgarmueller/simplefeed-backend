import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd';
import { User } from "@kittgen/user";
import { PostCreatedEvent } from './events/post-created.event';
import { PostLikedEvent } from './events/post-liked.event';
import { Like } from './like';
import { PostUnlikedEvent } from './events/post-unliked.event';

const PREFIX = 'pos'
export type PostId = string
const createPostId = createId(PREFIX)

export class Post extends AggregateRoot {
 
  body: string
  author: User 
  postedTo?: User
  createdAt?: Date 
  deletedAt?: Date 
  likes?: Like[]

  public static create(props: Props<Post>, id?: string): Post {
    const isNewPost = !!id === false;
    const post = new Post({ ...props }, id);
    
    const trimmedBody = props.body.trim();
    if (trimmedBody.length === 0) {
      throw new Error('Post body is empty');
    }
    if (!props.author) {
      throw new Error("Author must be provided");
    }

    if (isNewPost) {
      post.emitDomainEvent(new PostCreatedEvent(post));
    }

    return post;
  }

  private constructor(props: Props<Post>, id?: string) {
    super(props, id || createPostId());
  }

  // TODO: add domain logic
  like(likedBy: User) {[]
    likedBy.profile.incrementLikeCount();
    const like = Like.create({ post: this, user: likedBy, userId: likedBy.id })
    if (!this.likes) {
      this.likes = [];
    }
    this.likes.push(like);
    this.emitDomainEvent(new PostLikedEvent(this, likedBy));
    return like;
  }

  unlike(unlikedBy: User): Like {
    unlikedBy.profile.decrementLikeCount();
    const like = this.likes.find(({ userId }) => userId === unlikedBy.id)
    this.likes = this.likes.filter(({ userId }) => userId !== unlikedBy.id)
    this.emitDomainEvent(new PostUnlikedEvent(this, unlikedBy));
    return like
  }
}
