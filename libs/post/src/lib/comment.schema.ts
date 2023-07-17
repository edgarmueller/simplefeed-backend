import { EntitySchema } from 'typeorm'
import { Comment } from './comment'

export const CommentSchema = new EntitySchema<Comment>({
  target: Comment,
  name: 'Comment',
  tableName: 'comment',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    content: {
      type: String,
    },
    path: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: Date,
      unique: false,
      nullable: false,
      name: 'created_at',
      createDate: true,
    },
    updatedAt: {
      type: Date,
      unique: false,
      nullable: false,
      name: 'updated_at',
      updateDate: true,
    },
    deletedAt: {
      type: Date,
      name: 'deleted_at',
      nullable: true,
      deleteDate: true,
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
    post: {
      type: 'many-to-one',
      target: 'Post',
      joinColumn: { name: 'post_id' },
    },
  },
})
