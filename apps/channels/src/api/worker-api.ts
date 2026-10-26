import { ApiError } from './simplefeed-client'

export type FeedStatus = 'pending' | 'active' | 'failed'

/** A feed someone added, as the API reports it to the worker. */
export interface FeedRequest {
  id: string
  url: string
  feedUrl?: string
  title?: string
  status: FeedStatus
  channel?: { id: string; username: string; firstName: string; lastName: string }
}

/** The endpoints only the worker may use, authenticated with the registration key. */
export class WorkerApi {
  constructor(
    private readonly apiUrl: string,
    private readonly key: string,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('x-bot-registration-key', this.key)
    if (init.body) {
      headers.set('Content-Type', 'application/json')
    }
    const response = await this.fetchFn(`${this.apiUrl}${path}`, { ...init, headers })
    if (!response.ok) {
      throw new ApiError(response.status, `${init.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`)
    }
    return (await response.json()) as T
  }

  feeds(statuses: FeedStatus[]): Promise<FeedRequest[]> {
    return this.request(`/worker/feeds?status=${statuses.join(',')}`)
  }

  activateFeed(feedId: string, activation: { feedUrl: string; title: string; channelUsername: string }): Promise<FeedRequest> {
    return this.request(`/worker/feeds/${feedId}/activate`, { method: 'POST', body: JSON.stringify(activation) })
  }

  failFeed(feedId: string, error: string): Promise<FeedRequest> {
    return this.request(`/worker/feeds/${feedId}/fail`, { method: 'POST', body: JSON.stringify({ error }) })
  }
}
