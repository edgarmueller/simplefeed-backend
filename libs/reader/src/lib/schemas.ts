import { EntitySchema } from 'typeorm'
import { Channel } from './channel'
import { Entry } from './entry'
import { Item } from './item'
import { Subscription } from './subscription'
import { TuningMessage } from './tuning-message'

const createdAt = { type: Date, name: 'created_at', createDate: true } as const

export const ChannelSchema = new EntitySchema<Channel>({
  target: Channel,
  name: 'Channel',
  tableName: 'channel',
  columns: {
    id: { type: String, primary: true },
    kind: { type: String },
    name: { type: String, nullable: true },
    description: { type: String, nullable: true },
    url: { type: String, nullable: true, unique: true },
    feedUrl: { type: String, name: 'feed_url', nullable: true },
    siteUrl: { type: String, name: 'site_url', nullable: true },
    status: { type: String },
    error: { type: String, nullable: true },
    createdAt,
    updatedAt: { type: Date, name: 'updated_at', updateDate: true },
  },
})

export const SubscriptionSchema = new EntitySchema<Subscription>({
  target: Subscription,
  name: 'Subscription',
  tableName: 'subscription',
  columns: {
    id: { type: String, primary: true },
    userId: { type: String, name: 'user_id' },
    preferences: { type: 'jsonb' },
    createdAt,
  },
  relations: {
    user: { type: 'many-to-one', target: 'User', onDelete: 'CASCADE', joinColumn: { name: 'user_id' } },
    channel: {
      type: 'many-to-one',
      target: 'Channel',
      eager: true,
      onDelete: 'CASCADE',
      joinColumn: { name: 'channel_id' },
    },
  },
  uniques: [{ name: 'UQ_subscription_user_channel', columns: ['userId', 'channel'] }],
})

export const ItemSchema = new EntitySchema<Item>({
  target: Item,
  name: 'Item',
  tableName: 'item',
  columns: {
    id: { type: String, primary: true },
    externalId: { type: String, name: 'external_id' },
    title: { type: String },
    url: { type: String },
    domain: { type: String },
    excerpt: { type: String, nullable: true },
    score: { type: Number, nullable: true },
    comments: { type: Number, nullable: true },
    discussionUrl: { type: String, name: 'discussion_url', nullable: true },
    sourceName: { type: String, name: 'source_name', nullable: true },
    publishedAt: { type: Date, name: 'published_at' },
    fetchedAt: { type: Date, name: 'fetched_at', createDate: true },
  },
  relations: {
    channel: { type: 'many-to-one', target: 'Channel', onDelete: 'CASCADE', joinColumn: { name: 'channel_id' } },
  },
  uniques: [{ name: 'UQ_item_channel_external_id', columns: ['channel', 'externalId'] }],
  indices: [{ name: 'IDX_item_channel_published', columns: ['channel', 'publishedAt'] }],
})

export const EntrySchema = new EntitySchema<Entry>({
  target: Entry,
  name: 'Entry',
  tableName: 'entry',
  columns: {
    id: { type: String, primary: true },
    userId: { type: String, name: 'user_id' },
    summary: { type: String, nullable: true },
    pickedAt: { type: Date, name: 'picked_at' },
    readAt: { type: Date, name: 'read_at', nullable: true },
    likedAt: { type: Date, name: 'liked_at', nullable: true },
    savedAt: { type: Date, name: 'saved_at', nullable: true },
  },
  relations: {
    user: { type: 'many-to-one', target: 'User', onDelete: 'CASCADE', joinColumn: { name: 'user_id' } },
    subscription: {
      type: 'many-to-one',
      target: 'Subscription',
      onDelete: 'CASCADE',
      joinColumn: { name: 'subscription_id' },
    },
    item: { type: 'many-to-one', target: 'Item', onDelete: 'CASCADE', joinColumn: { name: 'item_id' } },
  },
  uniques: [{ name: 'UQ_entry_user_item', columns: ['userId', 'item'] }],
  indices: [{ name: 'IDX_entry_user_picked', columns: ['userId', 'pickedAt'] }],
})

export const TuningMessageSchema = new EntitySchema<TuningMessage>({
  target: TuningMessage,
  name: 'TuningMessage',
  tableName: 'tuning_message',
  columns: {
    id: { type: String, primary: true },
    author: { type: String },
    content: { type: String },
    answered: { type: Boolean, default: false },
    createdAt,
  },
  relations: {
    subscription: {
      type: 'many-to-one',
      target: 'Subscription',
      onDelete: 'CASCADE',
      joinColumn: { name: 'subscription_id' },
    },
  },
})

export const readerSchemas = [ChannelSchema, SubscriptionSchema, ItemSchema, EntrySchema, TuningMessageSchema]
