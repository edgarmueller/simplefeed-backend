import { Injectable } from '@nestjs/common'
import { Transactional } from 'typeorm-transactional'
import { Channel, normalizeFeedUrl } from './channel'
import { ReaderRepository } from './reader.repository'
import { Subscription } from './subscription'

/** What readers do with channels: browse, add feeds, subscribe. */
@Injectable()
export class ChannelUsecases {
  constructor(private readonly repository: ReaderRepository) {}

  /** The channels anyone can subscribe to. */
  catalog(): Promise<Channel[]> {
    return this.repository.findChannels(['active'])
  }

  /** The reader's subscriptions, including feeds still being read or that failed. */
  subscriptionsOf(userId: string): Promise<Subscription[]> {
    return this.repository.findSubscriptionsOfUser(userId)
  }

  /**
   * Adds a feed by its URL or a website's and subscribes the reader. A feed
   * that is a channel already is subscribed to as is; a new one is pending
   * until the worker has read it, and a failed one gets another try.
   */
  @Transactional()
  async addFeed(userId: string, url: string): Promise<Subscription> {
    const normalized = normalizeFeedUrl(url)
    let channel = await this.repository.findChannelByUrl(normalized)
    if (!channel) {
      channel = await this.repository.saveChannel(Channel.feed(normalized))
    } else if (channel.status === 'failed') {
      channel.retry()
      channel = await this.repository.saveChannel(channel)
    }
    return this.subscribe(userId, channel.id)
  }

  /** Subscribing twice is fine. */
  async subscribe(userId: string, channelId: string): Promise<Subscription> {
    const existing = await this.repository.findSubscription(userId, channelId)
    if (existing) {
      return existing
    }
    const channel = await this.repository.findChannelOrFail(channelId)
    return this.repository.saveSubscription(Subscription.create({ userId, channel }))
  }

  /** Feeds that never became channels go away with their last subscriber. */
  @Transactional()
  async unsubscribe(userId: string, channelId: string): Promise<void> {
    const subscription = await this.repository.findSubscription(userId, channelId)
    if (!subscription) {
      return
    }
    await this.repository.deleteSubscription(subscription)
    const channel = subscription.channel
    if (channel.status !== 'active' && (await this.repository.countSubscriptions(channel.id)) === 0) {
      await this.repository.deleteChannel(channel)
    }
  }
}
