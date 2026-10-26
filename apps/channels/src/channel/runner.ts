import { ChannelInfo, SubscriptionContext, WorkerApi } from '../api/worker-api'
import { Logger } from '../logger'
import { Source } from '../sources/story'
import { Curator } from './curator'
import { normalizePreferences } from './preferences'

/** how many stories to fetch per run */
const FETCH_COUNT = 60
/** spreads a day's picks over several runs */
const MAX_PICKS_PER_RUN = 3
/** by default, stories older than this are no longer news */
const DEFAULT_MAX_AGE_MS = 48 * 60 * 60 * 1000

export interface ChannelRunnerDependencies {
  api: WorkerApi
  curator: Curator
  /** where a channel's stories come from */
  sourceFor: (channel: ChannelInfo) => Source
  /** stories older than this are skipped; feeds that post rarely want longer */
  maxAgeFor?: (channel: ChannelInfo) => number
  logger?: Logger
  now?: () => Date
}

/** Fetches a channel's stories and picks the best of them for each of its readers. */
export class ChannelRunner {
  private readonly logger: Logger
  private readonly now: () => Date
  /** channels fetched since the worker started */
  private readonly fetched = new Set<string>()

  constructor(private readonly deps: ChannelRunnerDependencies) {
    this.logger = deps.logger ?? console
    this.now = deps.now ?? (() => new Date())
  }

  private startOfDay(): Date {
    const start = new Date(this.now())
    start.setHours(0, 0, 0, 0)
    return start
  }

  /** Fetches the channel's latest stories, stores them, and picks for every subscriber. */
  async run(channel: ChannelInfo): Promise<void> {
    const stories = await this.deps.sourceFor(channel).latest(FETCH_COUNT)
    await this.deps.api.storeItems(channel.id, stories)
    this.fetched.add(channel.id)
    const subscriptions = await this.deps.api.subscriptions(channel.id, this.startOfDay())
    for (const subscription of subscriptions) {
      await this.pick(subscription).catch((error) => this.logger.error(`could not pick for ${subscription.id}: ${error}`))
    }
  }

  /**
   * Picks for subscriptions that haven't got anything yet, so a new
   * subscriber doesn't wait for the next run. A channel this worker hasn't
   * fetched yet is fetched first.
   */
  async pickForFresh(): Promise<void> {
    for (const subscription of await this.deps.api.freshSubscriptions(this.startOfDay())) {
      const picked = await this.pick(subscription)
      if (picked === 0 && !this.fetched.has(subscription.channel.id)) {
        await this.run(subscription.channel)
      }
    }
  }

  /** Picks the best new items for one reader, within their daily limit. Returns how many. */
  async pick(subscription: SubscriptionContext): Promise<number> {
    const preferences = normalizePreferences(subscription.preferences)
    const remaining = preferences.maxPostsPerDay - subscription.pickedSince
    if (remaining <= 0) {
      return 0
    }
    const maxAgeMs = this.deps.maxAgeFor?.(subscription.channel) ?? DEFAULT_MAX_AGE_MS
    const candidates = (await this.deps.api.candidates(subscription.id, new Date(this.now().getTime() - maxAgeMs))).filter(
      // only stories with points can be too low-scoring
      (story) => story.score === undefined || story.score >= preferences.minScore
    )
    const picks = await this.deps.curator.pick(
      candidates,
      preferences,
      Math.min(remaining, MAX_PICKS_PER_RUN),
      subscription.likedTitles
    )
    if (picks.length > 0) {
      await this.deps.api.pick(
        subscription.id,
        picks.map(({ story, summary }) => ({ itemId: story.id, summary }))
      )
      this.logger.log(`${subscription.channel.name ?? subscription.channel.id} picked ${picks.length} for ${subscription.id}`)
    }
    return picks.length
  }
}
