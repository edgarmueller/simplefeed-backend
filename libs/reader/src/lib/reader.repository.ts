import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Page, PageOptions, paginate } from '@simplefeed/shared-ddd'
import { In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm'
import { Channel, ChannelStatus } from './channel'
import { Entry } from './entry'
import { Item } from './item'
import { Subscription } from './subscription'
import { TuningMessage } from './tuning-message'

export interface FeedStats {
  unread: number
  lastPickedAt?: Date
}

export interface FeedFilter {
  channelId?: string
  unread?: boolean
  saved?: boolean
}

/** Item fields the worker reports; the rest is filled in on storing. */
export type ItemFields = Omit<Item, 'id' | 'channel' | 'fetchedAt'>

const UPDATABLE_ITEM_COLUMNS = ['title', 'url', 'domain', 'excerpt', 'score', 'comments', 'discussion_url', 'source_name']

@Injectable()
export class ReaderRepository {
  constructor(
    @InjectRepository(Channel) private readonly channels: Repository<Channel>,
    @InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Item) private readonly items: Repository<Item>,
    @InjectRepository(Entry) private readonly entries: Repository<Entry>,
    @InjectRepository(TuningMessage) private readonly messages: Repository<TuningMessage>
  ) {}

  // channels

  saveChannel(channel: Channel): Promise<Channel> {
    return this.channels.save(channel)
  }

  deleteChannel(channel: Channel): Promise<Channel> {
    return this.channels.remove(channel)
  }

  findChannelOrFail(id: string): Promise<Channel> {
    return this.channels.findOneOrFail({ where: { id } })
  }

  /** The feed added at `url`, or whose feed was found at it. */
  findChannelByUrl(url: string): Promise<Channel | null> {
    return this.channels.findOne({ where: [{ url }, { feedUrl: url }] })
  }

  findActiveChannelByFeedUrl(feedUrl: string): Promise<Channel | null> {
    return this.channels.findOne({ where: { feedUrl, status: 'active' } })
  }

  findChannels(statuses: ChannelStatus[]): Promise<Channel[]> {
    return this.channels.find({ where: { status: In(statuses) }, order: { createdAt: 'ASC' } })
  }

  // subscriptions

  saveSubscription(subscription: Subscription): Promise<Subscription> {
    return this.subscriptions.save(subscription)
  }

  async deleteSubscription(subscription: Subscription): Promise<void> {
    await this.subscriptions.remove(subscription)
  }

  findSubscription(userId: string, channelId: string): Promise<Subscription | null> {
    return this.subscriptions.findOne({ where: { userId, channel: { id: channelId } } })
  }

  findSubscriptionOrFail(id: string): Promise<Subscription> {
    return this.subscriptions.findOneOrFail({ where: { id } })
  }

  findSubscriptionsOfUser(userId: string): Promise<Subscription[]> {
    return this.subscriptions.find({ where: { userId }, order: { createdAt: 'ASC' } })
  }

  findSubscriptionsOfChannel(channelId: string): Promise<Subscription[]> {
    return this.subscriptions.find({ where: { channel: { id: channelId } } })
  }

  countSubscriptions(channelId: string): Promise<number> {
    return this.subscriptions.count({ where: { channel: { id: channelId } } })
  }

  /** Subscriptions whose channel hasn't picked anything for them yet. */
  findFreshSubscriptions(): Promise<Subscription[]> {
    return this.subscriptions
      .createQueryBuilder('subscription')
      .innerJoinAndSelect('subscription.channel', 'channel', "channel.status = 'active'")
      .leftJoin(Entry, 'entry', 'entry.subscription_id = subscription.id')
      .where('entry.id IS NULL')
      .getMany()
  }

  // items

  /** Stores new items and refreshes known ones, e.g. their points, and returns them all. */
  async upsertItems(channel: Channel, fields: ItemFields[]): Promise<Item[]> {
    if (fields.length === 0) {
      return []
    }
    await this.items
      .createQueryBuilder()
      .insert()
      .values(fields.map((item) => Item.create({ ...item, channel })))
      .orUpdate(UPDATABLE_ITEM_COLUMNS, ['channel_id', 'external_id'])
      .execute()
    return this.items.find({
      where: { channel: { id: channel.id }, externalId: In(fields.map((item) => item.externalId)) },
    })
  }

  /** The channel's items since `since` that weren't picked for the reader yet, newest first. */
  findCandidates(channelId: string, userId: string, since: Date, limit: number): Promise<Item[]> {
    return this.items
      .createQueryBuilder('item')
      .leftJoin(Entry, 'entry', 'entry.item_id = item.id AND entry.user_id = :userId', { userId })
      .where('item.channel_id = :channelId', { channelId })
      .andWhere('item.published_at >= :since', { since })
      .andWhere('entry.id IS NULL')
      .orderBy('item.publishedAt', 'DESC')
      .take(limit)
      .getMany()
  }

  findItemsOfChannel(channelId: string, itemIds: string[]): Promise<Item[]> {
    return itemIds.length === 0 ? Promise.resolve([]) : this.items.find({ where: { channel: { id: channelId }, id: In(itemIds) } })
  }

  // entries

  async addEntries(entries: Entry[]): Promise<void> {
    if (entries.length > 0) {
      await this.entries.createQueryBuilder().insert().values(entries).orIgnore().execute()
    }
  }

  countPickedSince(subscriptionId: string, since: Date): Promise<number> {
    return this.entries.count({ where: { subscription: { id: subscriptionId }, pickedAt: MoreThanOrEqual(since) } })
  }

  async likedTitles(subscriptionId: string, limit: number): Promise<string[]> {
    const liked = await this.entries.find({
      where: { subscription: { id: subscriptionId }, likedAt: Not(IsNull()) },
      relations: { item: true },
      order: { likedAt: 'DESC' },
      take: limit,
    })
    return liked.map((entry) => entry.item.title)
  }

  findFeed(userId: string, filter: FeedFilter, page: PageOptions): Promise<Page<Entry>> {
    const query = this.entries
      .createQueryBuilder('entry')
      .innerJoinAndSelect('entry.item', 'item')
      .innerJoinAndSelect('entry.subscription', 'subscription')
      .innerJoinAndSelect('subscription.channel', 'channel')
      .where('entry.user_id = :userId', { userId })
      .orderBy('entry.pickedAt', 'DESC')
    if (filter.channelId) query.andWhere('channel.id = :channelId', { channelId: filter.channelId })
    if (filter.unread) query.andWhere('entry.read_at IS NULL')
    if (filter.saved) query.andWhere('entry.saved_at IS NOT NULL')
    return paginate(query, page)
  }

  findEntryOrFail(id: string, userId: string): Promise<Entry> {
    return this.entries.findOneOrFail({
      where: { id, userId },
      relations: { item: true, subscription: true },
    })
  }

  saveEntry(entry: Entry): Promise<Entry> {
    return this.entries.save(entry)
  }

  async markAllRead(userId: string, channelId: string | undefined, now: Date): Promise<number> {
    const query = this.entries
      .createQueryBuilder()
      .update()
      .set({ readAt: now })
      .where('user_id = :userId AND read_at IS NULL', { userId })
    if (channelId) {
      query.andWhere('subscription_id IN (SELECT id FROM simplefeed.subscription WHERE channel_id = :channelId)', { channelId })
    }
    return (await query.execute()).affected ?? 0
  }

  /** Per channel: how many entries are unread, and when the last one was picked. */
  async feedStats(userId: string): Promise<Record<string, FeedStats>> {
    const rows: { channelId: string; unread: string; lastPickedAt: Date }[] = await this.entries
      .createQueryBuilder('entry')
      .innerJoin('entry.subscription', 'subscription')
      .select('subscription.channel_id', 'channelId')
      .addSelect('count(*) FILTER (WHERE entry.read_at IS NULL)', 'unread')
      .addSelect('max(entry.picked_at)', 'lastPickedAt')
      .where('entry.user_id = :userId', { userId })
      .groupBy('subscription.channel_id')
      .getRawMany()
    return Object.fromEntries(
      rows.map((row) => [row.channelId, { unread: Number(row.unread), lastPickedAt: row.lastPickedAt }])
    )
  }

  // tuning

  saveMessage(message: TuningMessage): Promise<TuningMessage> {
    return this.messages.save(message)
  }

  findMessageOrFail(id: string): Promise<TuningMessage> {
    return this.messages.findOneOrFail({ where: { id }, relations: { subscription: true } })
  }

  findMessages(subscriptionId: string, limit = 100): Promise<TuningMessage[]> {
    return this.messages
      .find({ where: { subscription: { id: subscriptionId } }, order: { createdAt: 'DESC' }, take: limit })
      .then((messages) => messages.reverse())
  }

  findUnansweredMessages(): Promise<TuningMessage[]> {
    return this.messages.find({
      where: { author: 'reader', answered: false },
      relations: { subscription: true },
      order: { createdAt: 'ASC' },
    })
  }

  async deleteAll(): Promise<void> {
    await this.messages.createQueryBuilder().delete().execute()
    await this.entries.createQueryBuilder().delete().execute()
    await this.items.createQueryBuilder().delete().execute()
    await this.subscriptions.createQueryBuilder().delete().execute()
    await this.channels.createQueryBuilder().delete().where("kind <> 'hackernews'").execute()
  }
}
