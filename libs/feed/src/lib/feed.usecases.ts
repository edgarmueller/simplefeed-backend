import { Injectable } from '@nestjs/common'
import { SubscriptionUsecases, User, UsersRepository } from '@simplefeed/user'
import { Feed, FeedStatus, normalizeFeedUrl } from './feed'
import { FeedRepository } from './feed.repository'

@Injectable()
export class FeedUsecases {
  constructor(
    private readonly feeds: FeedRepository,
    private readonly users: UsersRepository,
    private readonly subscriptions: SubscriptionUsecases
  ) {}

  /**
   * Adds a feed by its URL or a website's. A feed that is a channel already
   * is subscribed to right away; otherwise the request waits for the worker.
   */
  async add(user: User, url: string): Promise<Feed> {
    const normalized = normalizeFeedUrl(url)
    const existing = await this.feeds.findByUrl(normalized)
    if (existing?.status === 'active' && existing.channel) {
      await this.subscriptions.subscribe(user, existing.channel.profile.username)
      return existing
    }
    const requester = await this.users.findOneByIdOrFail(user.id)
    if (existing) {
      existing.requestAgain(requester)
      return this.feeds.save(existing)
    }
    return this.feeds.save(Feed.request(normalized, requester))
  }

  /** The user's feeds that aren't channels yet: pending or failed. */
  requestedBy(user: User): Promise<Feed[]> {
    return this.feeds.findRequestedBy(user.id)
  }

  async withdraw(user: User, feedId: string): Promise<void> {
    const feed = await this.feeds.findOneByIdOrFail(feedId)
    feed.withdraw(user)
    if (feed.status !== 'active' && !feed.requesters?.length) {
      await this.feeds.delete(feed)
    } else {
      await this.feeds.save(feed)
    }
  }

  /** For the channels worker. */
  withStatus(statuses: FeedStatus[]): Promise<Feed[]> {
    return this.feeds.findByStatus(statuses)
  }

  /**
   * The worker found the feed and created its channel. If another feed
   * already posts the same feed, the requesters are subscribed to that one
   * instead and the duplicate goes away.
   */
  async activate(feedId: string, feedUrl: string, title: string, channelUsername: string): Promise<Feed> {
    const feed = await this.feeds.findOneByIdOrFail(feedId)
    const twin = await this.feeds.findActiveByFeedUrl(feedUrl)
    if (twin && twin.id !== feed.id && twin.channel) {
      for (const requester of feed.requesters ?? []) {
        await this.subscriptions.subscribe(requester, twin.channel.profile.username)
      }
      await this.feeds.delete(feed)
      return twin
    }
    const channel = await this.users.findOneByUsernameOrFail(channelUsername)
    feed.activate(channel, feedUrl, title)
    return this.feeds.save(feed)
  }

  async fail(feedId: string, error: string): Promise<Feed> {
    const feed = await this.feeds.findOneByIdOrFail(feedId)
    feed.fail(error)
    return this.feeds.save(feed)
  }
}
