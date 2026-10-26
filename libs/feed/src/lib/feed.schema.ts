import { EntitySchema } from 'typeorm'
import { Feed } from './feed'

export const FeedSchema = new EntitySchema<Feed>({
  target: Feed,
  name: 'Feed',
  tableName: 'feed',
  columns: {
    id: {
      type: String,
      primary: true,
    },
    url: {
      type: String,
      unique: true,
    },
    feedUrl: {
      type: String,
      name: 'feed_url',
      nullable: true,
    },
    title: {
      type: String,
      nullable: true,
    },
    status: {
      type: String,
    },
    error: {
      type: String,
      nullable: true,
    },
    createdAt: {
      type: Date,
      name: 'created_at',
      createDate: true,
    },
    updatedAt: {
      type: Date,
      name: 'updated_at',
      updateDate: true,
    },
  },
  relations: {
    channel: {
      type: 'many-to-one',
      target: 'User',
      nullable: true,
      onDelete: 'SET NULL',
      joinColumn: { name: 'channel_id' },
    },
    requesters: {
      type: 'many-to-many',
      target: 'User',
      joinTable: {
        name: 'feed_requesters',
        joinColumn: { name: 'feed_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
      },
    },
  },
})
