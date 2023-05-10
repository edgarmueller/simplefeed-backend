import { EntitySchema } from 'typeorm'
import { FriendRequest } from './friend-request'

export const FriendRequestSchema = new EntitySchema<FriendRequest>({
  target: FriendRequest,
  name: 'FriendRequest',
  tableName: 'friend_request',
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
  },
  relations: {
    from: {
      type: 'many-to-one',
      target: 'User',
      inverseSide: 'outgoingFriendRequests',
      joinColumn: { name: 'from_user_id' },
    },
    to: {
      type: 'many-to-one',
      target: 'User',
      inverseSide: 'incomingFriendRequests',
      joinColumn: { name: 'to_user_id' },
    },
  },
})
