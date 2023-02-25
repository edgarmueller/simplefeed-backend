import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd';
import { PostCreatedEvent } from './events/post-created.event';
import { User } from "@kittgen/user";

const PREFIX = 'pos'
export type PostId = string
const createPostId = createId(PREFIX)

export class Post extends AggregateRoot {
  
  addedBy?: string 
  postedTo?: string 
  createdAt?: Date 
  
  user: User[] 

  public static create(props: Props<Post>, id?: string): Post {
    const isNewPost = !!id === false;
    const post = new Post({ ...props }, id);

    if (isNewPost) {
      post.emitDomainEvent(new PostCreatedEvent(post));
    }

    return post;
  }

  private constructor(props: Props<Post>, id?: string) {
    super(props, id || createPostId());
  }

  // TODO: add domain logic
}
