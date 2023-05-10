import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd';
import { PostCreatedEvent } from './events/post-created.event';
import { User } from "@kittgen/user";
import { Like } from './like';

const PREFIX = 'pos'
export type PostId = string
const createPostId = createId(PREFIX)

export class Post extends AggregateRoot {
 
  body: string
  author: User 
  postedTo?: User
  createdAt?: Date 
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
    // this.nrOfLikes = this.nrOfLikes + 1;
    likedBy.profile.nrOfLikes = likedBy.profile.nrOfLikes + 1;
    const like = Like.create({ post: this, user: likedBy })
    if (!this.likes) {
      this.likes = [];
    }
    this.likes.push(like);
    return like;
  }
}
