import { EntitySchema } from 'typeorm'
import { Conversation } from './conversation'

export const ConversationSchema = new EntitySchema<Conversation>({
  target: Conversation,
  name: 'Conversation',
  tableName: 'conversations',
  columns: {
    id: {
      type: String,
      primary: true,
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
    },
    userIds: {
      name: 'user_ids',
      type: 'jsonb',
    }
  },
  relations: {
    messages: {
      type: 'one-to-many',
      target: 'Message',
      inverseSide: 'conversation',
    },
  },
})
