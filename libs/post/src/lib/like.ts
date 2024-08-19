import { Entity, Props, createId } from '@simplefeed/shared-ddd'
import { User } from '@simplefeed/user'
import { Post } from './post'

const PREFIX = 'like'
const createLikeId = createId(PREFIX)

export class Like implements Entity {
  id: string
  user: User
  userId: string
  unliked?: boolean
  post: Post
  createdAt?: Date

  public static create(props: Props<Like>, id?: string): Like {
    const like = new Like({ ...props }, id)

    if (!props.user) {
      throw new Error('User must be provided')
    }

    if (!props.post) {
      throw new Error('Post must be provided')
    }

    return like
  }

  constructor(props: Props<Like>, id?: string) {
    Object.assign(this, props)
    this.id = id || createLikeId()
  }

  unlike() {
    this.unliked = true
  }

  like() {
    this.unliked = false
  }
}
