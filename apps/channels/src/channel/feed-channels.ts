import { createHash } from 'node:crypto'
import { Account, SimplefeedClient } from '../api/simplefeed-client'
import { FeedRequest, WorkerApi } from '../api/worker-api'
import { Logger } from '../logger'
import { PageFetcher } from '../sources/safe-fetch'
import { FeedSource, discoverFeed } from '../sources/rss'
import { Source, hostname } from '../sources/story'

const MAX_USERNAME_SLUG = 24
const MAX_NAME_LENGTH = 60
const MAX_BIO_LENGTH = 280

const emailOf = (username: string) => `${username}@channels.simplefeed.local`

/**
 * The account of the channel posting a feed. The username combines the
 * title with a hash of the feed's URL, e.g. "sz-muenchen-3fa9c1", so it is
 * readable, and the same feed always gets the same account.
 */
export function feedAccount(feedUrl: string, title: string, description?: string): Account {
  const slug =
    title
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_USERNAME_SLUG)
      .replace(/-+$/, '') || 'feed'
  const username = `${slug}-${createHash('sha256').update(feedUrl).digest('hex').slice(0, 6)}`
  return {
    username,
    firstName: title.slice(0, MAX_NAME_LENGTH),
    lastName: '',
    email: emailOf(username),
    bio: (description || `Posts from ${hostname(feedUrl) ?? feedUrl}.`).slice(0, MAX_BIO_LENGTH),
  }
}

export interface FeedChannelsDependencies {
  api: WorkerApi
  fetchPage: PageFetcher
  registrationKey: string
  createClient: (account: Account) => SimplefeedClient
  /** runs the channel for an active feed */
  start: (client: SimplefeedClient, source: Source) => void | Promise<void>
  logger?: Logger
}

/** Turns feeds users added into channels, and runs them. */
export class FeedChannels {
  private readonly logger: Logger
  private readonly running = new Set<string>()

  constructor(private readonly deps: FeedChannelsDependencies) {
    this.logger = deps.logger ?? console
  }

  async sync(): Promise<void> {
    await this.activatePending()
    await this.startActive()
  }

  /**
   * Reads each new feed, creates its channel account and activates it. Feeds
   * are read side by side, so a slow site doesn't hold up the others, and
   * one feed's failure doesn't stop the rest.
   */
  async activatePending(): Promise<void> {
    const pending = await this.deps.api.feeds(['pending'])
    await Promise.all(
      pending.map((feed) =>
        this.activate(feed).catch((error) =>
          // API errors are retried on the next sync, as the feed stays pending
          this.logger.error(`could not activate ${feed.url}: ${error}`)
        )
      )
    )
  }

  private async activate(feed: FeedRequest): Promise<void> {
    this.logger.log(`reading ${feed.url}`)
    let discovered
    try {
      discovered = await discoverFeed(feed.url, this.deps.fetchPage)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      this.logger.warn(`could not read ${feed.url}: ${reason}`)
      await this.deps.api.failFeed(feed.id, reason)
      return
    }
    const { feedUrl, feed: parsed } = discovered
    const title = parsed.title || hostname(feedUrl) || feedUrl
    const account = feedAccount(feedUrl, title, parsed.description)
    await this.deps.createClient(account).ensureAccount(this.deps.registrationKey)
    await this.deps.api.activateFeed(feed.id, { feedUrl, title, channelUsername: account.username })
    this.logger.log(`${account.username} posts ${feedUrl}`)
  }

  /** Starts the channels of active feeds that aren't running yet. */
  async startActive(): Promise<void> {
    for (const feed of await this.deps.api.feeds(['active'])) {
      const username = feed.channel?.username
      if (!username || !feed.feedUrl || this.running.has(username)) {
        continue
      }
      this.running.add(username)
      try {
        await this.deps.start(this.deps.createClient(this.accountOf(feed, username)), new FeedSource(feed.feedUrl, this.deps.fetchPage))
      } catch (error) {
        this.running.delete(username)
        this.logger.error(`could not start ${username}: ${error}`)
      }
    }
  }

  private accountOf(feed: FeedRequest, username: string): Account {
    return {
      username,
      firstName: feed.channel?.firstName ?? feed.title ?? username,
      lastName: feed.channel?.lastName ?? '',
      email: emailOf(username),
      bio: '',
    }
  }
}
