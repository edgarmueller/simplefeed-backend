import { EntitySchema } from 'typeorm'
import { Comment } from './comment'

export const CommentSchema = new EntitySchema<Comment>({
  target: Comment,
  name: "Comment",
  tableName: "comment",
  columns: {
    id: {
      type: String,
      primary: true,
    },
		postedBy: {
			type: String,
			unique: false,
			nullable: false,
      
		},
		postedTo: {
			type: String,
			unique: false,
			nullable: false,
      
		},
		removed: {
			type: Boolean,
			unique: false,
			nullable: false,
		},
		createdAt: {
			type: Date,
			unique: false,
			nullable: false,
      
		},
  },
  relations: {
    post: {
      type: "many-to-one",
      target: "Post",
      joinColumn: { name: "post_id", }
    },
  }
})
