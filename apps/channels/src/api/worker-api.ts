import { Logger } from '../logger'
import { Preferences } from '../channel/preferences'
import { Story } from '../sources/story'

/** Thrown for unsuccessful responses, with the status code. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

export type ChannelKind = 'hackernews' | 'feed'
export type ChannelStatus = 'pending' | 'active' | 'failed'

export interface ChannelInfo {
  id: string
  kind: ChannelKind
  name?: string
  /** for feeds: the address as added */
  url?: string
  feedUrl?: string
  status: ChannelStatus
}

/** A reader's subscription, with what the curator needs to pick for them. */
export interface SubscriptionContext {
  id: string
  channel: ChannelInfo
  /** as stored; normalize before use */
  preferences: unknown
  /** how many items were picked for the reader since the `since` asked for */
  pickedSince: number
  /** titles of the channel's items the reader liked, most recent first */
  likedTitles: string[]
}

export interface StoredItem {
  id: string
  title: string
  url: string
  domain: string
  excerpt?: string
  score?: number
  comments?: number
  discussionUrl?: string
  sourceName?: string
  publishedAt: string
}

export interface UnansweredMessage {
  id: string
  subscriptionId: string
  channel: ChannelInfo
  content: string
  preferences: unknown
}

/** Turns a stored item into a story for the curator, keeping the item's id. */
export const toStory = (item: StoredItem): Story => ({
  id: item.id,
  title: item.title,
  url: item.url,
  domain: item.domain,
  excerpt: item.excerpt,
  score: item.score,
  comments: item.comments,
  discussionUrl: item.discussionUrl,
  sourceName: item.sourceName,
  postedAt: new Date(item.publishedAt),
})

/** The API's worker endpoints, authenticated with WORKER_API_KEY. */
export class WorkerApi {
  constructor(
    private readonly apiUrl: string,
    private readonly key: string,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('x-worker-key', this.key)
    if (init.body) {
      headers.set('Content-Type', 'application/json')
    }
    const response = await this.fetchFn(`${this.apiUrl}/worker${path}`, { ...init, headers })
    if (!response.ok) {
      throw new ApiError(response.status, `${init.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`)
    }
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) })
  }

  channels(statuses: ChannelStatus[]): Promise<ChannelInfo[]> {
    return this.request(`/channels?status=${statuses.join(',')}`)
  }

  activate(channelId: string, found: { feedUrl: string; name: string; description?: string; siteUrl?: string }): Promise<ChannelInfo> {
    return this.post(`/channels/${channelId}/activate`, found)
  }

  fail(channelId: string, error: string): Promise<ChannelInfo> {
    return this.post(`/channels/${channelId}/fail`, { error })
  }

  /** Stores the stories as the channel's items and returns them with their ids. */
  storeItems(channelId: string, stories: Story[]): Promise<StoredItem[]> {
    return this.post(`/channels/${channelId}/items`, {
      items: stories.map(({ id, postedAt, ...story }) => ({ ...story, externalId: id, publishedAt: postedAt.toISOString() })),
    })
  }

  subscriptions(channelId: string, since: Date): Promise<SubscriptionContext[]> {
    return this.request(`/channels/${channelId}/subscriptions?since=${since.toISOString()}`)
  }

  freshSubscriptions(since: Date): Promise<SubscriptionContext[]> {
    return this.request(`/subscriptions/fresh?since=${since.toISOString()}`)
  }

  async candidates(subscriptionId: string, since: Date): Promise<Story[]> {
    const items = await this.request<StoredItem[]>(`/subscriptions/${subscriptionId}/candidates?since=${since.toISOString()}`)
    return items.map(toStory)
  }

  pick(subscriptionId: string, picks: { itemId: string; summary?: string }[]): Promise<void> {
    return this.post(`/subscriptions/${subscriptionId}/picks`, { picks })
  }

  unansweredMessages(): Promise<UnansweredMessage[]> {
    return this.request('/messages/unanswered')
  }

  answer(messageId: string, reply: string, preferences: Preferences): Promise<void> {
    return this.post(`/messages/${messageId}/answer`, { reply, preferences })
  }
}

const API_RETRY_DELAY_MS = 5_000

/**
 * Runs `task`, retrying while the API is unreachable or failing, e.g. when
 * the worker starts before the API. Client errors such as a wrong key are
 * rethrown, since retrying won't fix them.
 */
export async function whenApiIsUp<T>(
  task: () => Promise<T>,
  logger: Logger = console,
  delayMs = API_RETRY_DELAY_MS
): Promise<T> {
  for (;;) {
    try {
      return await task()
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        throw error
      }
      logger.log(`waiting for the API (${error instanceof Error ? error.message : error}), retrying in ${delayMs / 1000}s`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
