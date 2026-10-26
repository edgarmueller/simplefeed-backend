import { ChannelInfo, WorkerApi } from '../api/worker-api'
import { Logger } from '../logger'
import { PageFetcher } from '../sources/safe-fetch'
import { discoverFeed } from '../sources/rss'
import { hostname } from '../sources/story'

export interface FeedDiscoveryDependencies {
  api: WorkerApi
  fetchPage: PageFetcher
  /** e.g. to fetch the new channel's items right away */
  onActivated?: (channel: ChannelInfo) => void | Promise<void>
  logger?: Logger
}

/** Reads the feeds users added and makes them channels, or says why it couldn't. */
export class FeedDiscovery {
  private readonly logger: Logger

  constructor(private readonly deps: FeedDiscoveryDependencies) {
    this.logger = deps.logger ?? console
  }

  /**
   * Reads each pending feed. Feeds are read side by side, so a slow site
   * doesn't hold up the others, and one feed's failure doesn't stop the rest.
   */
  async activatePending(): Promise<void> {
    const pending = await this.deps.api.channels(['pending'])
    await Promise.all(
      pending.map((channel) =>
        this.activate(channel).catch((error) =>
          // API errors are retried on the next round, as the feed stays pending
          this.logger.error(`could not activate ${channel.url}: ${error}`)
        )
      )
    )
  }

  private async activate(channel: ChannelInfo): Promise<void> {
    const url = channel.url ?? ''
    this.logger.log(`reading ${url}`)
    let discovered
    try {
      discovered = await discoverFeed(url, this.deps.fetchPage)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      this.logger.warn(`could not read ${url}: ${reason}`)
      await this.deps.api.fail(channel.id, reason)
      return
    }
    const { feedUrl, feed } = discovered
    const activated = await this.deps.api.activate(channel.id, {
      feedUrl,
      name: (feed.title || hostname(feedUrl) || feedUrl).slice(0, 200),
      description: feed.description?.slice(0, 1000),
      siteUrl: feed.siteUrl,
    })
    this.logger.log(`${activated.name} posts ${feedUrl}`)
    await this.deps.onActivated?.(activated)
  }
}
