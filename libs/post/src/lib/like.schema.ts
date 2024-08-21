import { EntitySchema } from 'typeorm'
import { Like } from './like'

export const LikeSchema = new EntitySchema<Like>({
  target: Like,
  name: 'Like',
  tableName: 'likes',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    unliked: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      unique: false,
      nullable: false,
      name: 'created_at',
      createDate: true,
    },
    userId: {
      type: String,
      name: 'user_id',
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' },
    },
    post: {
      type: 'many-to-one',
      target: 'Post',
      joinColumn: { name: 'post_id' },
      onDelete: 'CASCADE',
    },
  },
})
