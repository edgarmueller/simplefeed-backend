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
    createdAt: {
      type: Date,
      unique: false,
      nullable: false,
      name: 'created_at',
      createDate: true,
    },
    deletedAt: {
      type: Date,
      name: 'deleted_at',
      nullable: true,
      deleteDate: true,
    }
  },
  relations: {
    author: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'author_id'
      }
    },
    postedTo: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
      joinColumn: {
        name: 'posted_to',
      }
    },
    likes: {
      type: 'many-to-many',
      target: 'Like',
      inverseSide: 'post',
      cascade: true,
      onDelete: 'CASCADE',
      joinTable: {
        joinColumn: {
          name: 'post_id',
          referencedColumnName: 'id',
        },
        inverseJoinColumn: {
          name: 'like_id',
          referencedColumnName: 'id',
        },
      },
    },
  },
})
