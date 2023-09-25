import { User } from '@simplefeed/user';
import { Entity, Props, createId } from '@kittgen/shared-ddd';

import { Post } from "./post" 
import { CommentAddedEvent } from './events/commet-added.event';

const PREFIX = 'com'
export type CommentId = string
const createCommentId = createId(PREFIX)

export class Comment implements Entity {
  
  author: User 
  createdAt?: Date 
  updatedAt?: Date 
  deletedAt?: Date 
  content: string

  parentComment?: Comment
  post?: Post
  path?: string

  public static create(props: Props<Comment>, id?: string): Comment {
    const comment = new Comment({ ...props }, id);
    const isNewComment = !!id === false;
    if (isNewComment) {
      comment.post.emitDomainEvent(new CommentAddedEvent(comment.post, comment));
    }
    return comment;
  }

  private constructor(props: Props<Comment>, readonly id: string) {
    Object.assign(this, props)
    this.id = id || createCommentId()
  }
}
