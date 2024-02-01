import { EntitySchema } from 'typeorm'
import { Message } from './message'

export const MessageSchema = new EntitySchema<Message>({
  name: 'Message',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    content: {
      type: String,
      nullable: false,
    },
    authorId: {
      type: String,
    },
    recipientId: {
      type: String,
    },
    conversationId: {
      type: String,
    },
    isRead: {
      type: Boolean,
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
  },
  relations: {
    conversation: {
      type: 'many-to-one',
      target: 'Conversation',
      inverseSide: 'messages',
      joinColumn: {
        name: 'conversationId',
        referencedColumnName: 'id',
      },
    },
  },
})
