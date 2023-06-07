import { EntitySchema } from 'typeorm'
import { Profile } from './profile'

export const ProfileSchema = new EntitySchema<Profile>({
  target: Profile,
  name: 'Profile',
  tableName: 'profile',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    username: {
      type: String,
      unique: false,
      nullable: false,
    },
    bio: {
      type: String,
      unique: false,
      nullable: true,
    },
    firstName: {
      type: String,
      unique: false,
      nullable: false,
    },
    lastName: {
      type: String,
      unique: false,
      nullable: false,
    },
    imageUrl: {
      type: String,
      unique: false,
      nullable: true,
    },
    nrOfPosts: {
      type: Number,
      unique: false,
      default: 0,
      nullable: false
    },
    nrOfLikes: {
      type: Number,
      unique: false,
      default: 0,
      nullable: false
    },
    createdAt: {
      type: Date,
      unique: false,
      nullable: false,
      createDate: true,
    },
    updatedAt: {
      type: Date,
      unique: false,
      nullable: false,
      updateDate: true,
    },
  },
  relations: {
    user: {
      type: 'one-to-one',
      target: 'User',
      inverseSide: 'profile',
      onDelete: 'CASCADE',
      joinColumn: { name: 'user_id' },
    },
  },
})
