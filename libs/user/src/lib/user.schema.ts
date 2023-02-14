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
    profile: {
      type: 'one-to-one',
      target: 'Profile',
      inverseSide: 'user',
      eager: true,
      cascade: true
    },
  },
})
