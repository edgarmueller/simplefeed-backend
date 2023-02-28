import { EntitySchema } from 'typeorm'
import { Post } from './post'

export const PostSchema = new EntitySchema<Post>({
  target: Post,
  name: 'Post',
  tableName: 'posts',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    body: {
      type: String
    },
    postedTo: {
      type: String,
      unique: false,
      nullable: true,
      name: 'posted_to',
    },
    createdAt: {
      type: Date,
      unique: false,
      nullable: false,
      name: 'created_at',
      createDate: true,
    },
  },
  relations: {
    author: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'author_id'
      }
    },
  },
})
