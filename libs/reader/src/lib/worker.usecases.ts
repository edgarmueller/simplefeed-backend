import { Injectable } from '@nestjs/common'
import { Transactional } from 'typeorm-transactional'
import { Channel, ChannelStatus } from './channel'
import { Entry } from './entry'
import { Item } from './item'
import { ItemFields, ReaderRepository } from './reader.repository'
import { Subscription } from './subscription'
import { TuningMessage } from './tuning-message'

/** How many items a reader's channel considers per run. */
const MAX_CANDIDATES = 60
/** How many liked items the curator learns from. */
const MAX_LIKED = 20

export interface SubscriptionContext {
  subscription: Subscription
  pickedSince: number
  likedTitles: string[]
}

/** What the channels worker does: read feeds, store items, pick for readers, answer chats. */
@Injectable()
export class WorkerUsecases {
  constructor(private readonly repository: ReaderRepository) {}

  channels(statuses: ChannelStatus[]): Promise<Channel[]> {
    return this.repository.findChannels(statuses)
  }

  /**
   * The worker found the feed. If another channel already posts the same
   * feed, its subscribers move there and this channel goes away.
   */
  @Transactional()
  async activate(channelId: string, found: { feedUrl: string; name: string; description?: string; siteUrl?: string }): Promise<Channel> {
    const channel = await this.repository.findChannelOrFail(channelId)
    const twin = await this.repository.findActiveChannelByFeedUrl(found.feedUrl)
    if (twin && twin.id !== channel.id) {
      for (const subscription of await this.repository.findSubscriptionsOfChannel(channel.id)) {
        if (!(await this.repository.findSubscription(subscription.userId, twin.id))) {
          await this.repository.saveSubscription(Subscription.create({ userId: subscription.userId, channel: twin }))
        }
      }
      await this.repository.deleteChannel(channel)
      return twin
    }
    channel.activate(found)
    return this.repository.saveChannel(channel)
  }

  async fail(channelId: string, error: string): Promise<Channel> {
    const channel = await this.repository.findChannelOrFail(channelId)
    channel.fail(error)
    return this.repository.saveChannel(channel)
  }

  async storeItems(channelId: string, items: ItemFields[]): Promise<Item[]> {
    return this.repository.upsertItems(await this.repository.findChannelOrFail(channelId), items)
  }

  /** The channel's subscribers, with what the curator needs to pick for each. */
  async subscriptionsOf(channelId: string, since: Date): Promise<SubscriptionContext[]> {
    const subscriptions = await this.repository.findSubscriptionsOfChannel(channelId)
    return Promise.all(subscriptions.map((subscription) => this.contextOf(subscription, since)))
  }

  /** Subscriptions that haven't got anything yet, e.g. right after subscribing. */
  async freshSubscriptions(since: Date): Promise<SubscriptionContext[]> {
    const subscriptions = await this.repository.findFreshSubscriptions()
    return Promise.all(subscriptions.map((subscription) => this.contextOf(subscription, since)))
  }

  private async contextOf(subscription: Subscription, since: Date): Promise<SubscriptionContext> {
    return {
      subscription,
      pickedSince: await this.repository.countPickedSince(subscription.id, since),
      likedTitles: await this.repository.likedTitles(subscription.id, MAX_LIKED),
    }
  }

  async candidates(subscriptionId: string, since: Date): Promise<Item[]> {
    const subscription = await this.repository.findSubscriptionOrFail(subscriptionId)
    return this.repository.findCandidates(subscription.channel.id, subscription.userId, since, MAX_CANDIDATES)
  }

  /**
   * Adds the picks to the reader's feed, best first: the feed is newest
   * first, so earlier picks get slightly later times.
   */
  async pick(subscriptionId: string, picks: { itemId: string; summary?: string }[], now = new Date()): Promise<void> {
    const subscription = await this.repository.findSubscriptionOrFail(subscriptionId)
    // only items of the subscription's channel; ones picked before are ignored on insert
    const items = await this.repository.findItemsOfChannel(subscription.channel.id, picks.map((pick) => pick.itemId))
    const byId = new Map(items.map((item) => [item.id, item]))
    const entries = picks.flatMap(({ itemId, summary }, index) => {
      const item = byId.get(itemId)
      return item
        ? [Entry.create({ userId: subscription.userId, subscription, item, summary: summary ?? null, pickedAt: new Date(now.getTime() - index) })]
        : []
    })
    await this.repository.addEntries(entries)
  }

  unansweredMessages(): Promise<TuningMessage[]> {
    return this.repository.findUnansweredMessages()
  }

  /** Stores the channel's reply and the preferences the reader asked for. */
  @Transactional()
  async answer(messageId: string, reply: string, preferences: unknown): Promise<TuningMessage> {
    const message = await this.repository.findMessageOrFail(messageId)
    const subscription = message.subscription
    subscription.tune(preferences)
    await this.repository.saveSubscription(subscription)
    message.answered = true
    await this.repository.saveMessage(message)
    return this.repository.saveMessage(TuningMessage.create({ subscription, author: 'channel', content: reply, answered: true }))
  }
}
