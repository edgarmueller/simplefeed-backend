import { Entity, Props, createId } from '@kittgen/shared-ddd';

import { Post } from "./post" 

const PREFIX = 'com'
export type CommentId = string
const createCommentId = createId(PREFIX)

export class Comment implements Entity {
  
  postedBy?: string 
  postedTo?: string 
  removed?: boolean 
  createdAt?: Date 
  
  post: Post[] 

  public static create(props: Props<Comment>, id?: string): Comment {
    const comment = new Comment({ ...props }, id);
    return comment;
  }

  private constructor(props: Props<Comment>, readonly id: string) {
    Object.assign(this, props)
    this.id = id || createCommentId()
  }

  // TODO: add domain logic
}
