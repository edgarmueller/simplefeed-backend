import { EntitySchema } from 'typeorm'
import { Notification } from '../../notification'

export const NotificationSchema = new EntitySchema<Notification>({
  name: 'Notification',
  target: Notification,
  tableName: 'notification',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    senderId: {
      type: String,
    },
    recipientId: {
      type: String,
    },
    content: {
      type: String,
    },
    opened: {
      type: Boolean,
    },
    viewed: {
      type: Boolean,
    },
    type: {
      type: String,
    },
    resourceId: {
      type: String,
    },
    createdAt: {
      type: Date,
      unique: false,
      nullable: false,
      name: 'created_at',
      createDate: true,
    },
  },
})
