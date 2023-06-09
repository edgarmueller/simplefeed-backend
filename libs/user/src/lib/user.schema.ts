import { EntitySchema } from 'typeorm'
import { User } from './user'

export const UserSchema = new EntitySchema<User>({
  target: User,
  name: 'User',
  tableName: 'user',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    email: {
      type: String,
      unique: true,
      nullable: false,
      name: 'email',
    },
    password: {
      type: String,
      unique: false,
      nullable: false,
      name: 'password',
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
  },
  relations: {
    friends: {
      type: 'many-to-many',
      target: 'User',
      joinTable: {
        joinColumn: {
          name: 'user_id',
          referencedColumnName: 'id',
        },
        inverseJoinColumn: {
          name: 'befriended_by_id',
          referencedColumnName: 'id',
        },
      },
    },
    friendRequests: {
      type: 'many-to-many',
      target: 'FriendRequest',
      inverseSide: 'to',
      cascade: true,
      onDelete: 'CASCADE',
      joinTable: {
        joinColumn: {
          name: 'from_user_id',
          referencedColumnName: 'id',
        },
        inverseJoinColumn: {
          name: 'to_user_id',
          referencedColumnName: 'id',
        },
      },
    },
    profile: {
      type: 'one-to-one',
      target: 'Profile',
      inverseSide: 'user',
      eager: true,
      cascade: true,
    }
  },
})
