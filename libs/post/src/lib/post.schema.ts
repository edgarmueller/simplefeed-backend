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
    addedBy: {
      type: String,
      unique: false,
      nullable: false,
      name: 'added_by',
    },
    postedTo: {
      type: String,
      unique: false,
      nullable: false,
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
    user: {
      type: 'many-to-one',
      target: 'User',
    },
  },
})
