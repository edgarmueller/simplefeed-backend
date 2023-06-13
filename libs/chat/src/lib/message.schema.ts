import { EntitySchema } from 'typeorm'
import { Message } from './message'

export const MessageSchema = new EntitySchema<Message>({
  name: 'Message',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    content: {
      type: String,
      nullable: false,
    },
    sender: {
      type: String,
    },
    recipient: {
      type: String,
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
    },
  },
})
