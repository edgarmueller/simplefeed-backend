import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd';
import { User } from "@simplefeed/user";
import { PostCreatedEvent } from './events/post-created.event';
import { PostLikedEvent } from './events/post-liked.event';
import { Like } from './like';
import { PostUnlikedEvent } from './events/post-unliked.event';

const PREFIX = 'pos'
export type PostId = string
const createPostId = createId(PREFIX)

export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link'
}

export type Attachment = {
  type: AttachmentType
  url?: string
  buffer?: Buffer
  filename?: string
};

export class Post extends AggregateRoot {
 
  body: string
  author: User 
  attachments?: Attachment[]
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

  like(likedBy: User) {[]
    if (this.hasLikeBy(likedBy)) { 
      return;
    }
    likedBy.profile.incrementLikeCount();
    const like = Like.create({ post: this, user: likedBy, userId: likedBy.id })
    if (!this.likes) {
      this.likes = [];
    }
    this.likes.push(like);
    // don't emit event if author liked their own post
    if (this.author.id !== likedBy.id) {
      this.emitDomainEvent(new PostLikedEvent(this, likedBy));
    }
    return like;
  }

  hasLikeBy(user: User): boolean {
    return !!this.likes?.find(({ userId }) => userId === user.id);
  }

  unlike(unlikedBy: User): Like {
    unlikedBy.profile.decrementLikeCount();
    const like = this.likes.find(({ userId }) => userId === unlikedBy.id)
    like.unlike();
    this.emitDomainEvent(new PostUnlikedEvent(this, unlikedBy, like));
    return like
  }
}
