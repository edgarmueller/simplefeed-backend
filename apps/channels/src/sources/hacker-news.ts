export interface Story {
  id: number
  title: string
  url: string
  /** where the link points, e.g. "github.com"; "news.ycombinator.com" for Ask HN */
  domain: string
  score: number
  comments: number
  postedAt: Date
  discussionUrl: string
}

interface HackerNewsItem {
  id: number
  type?: string
  title?: string
  url?: string
  score?: number
  descendants?: number
  time?: number
  dead?: boolean
  deleted?: boolean
}

const discussionUrl = (id: number) => `https://news.ycombinator.com/item?id=${id}`

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

function toStory(item: HackerNewsItem | null): Story | undefined {
  if (!item || item.type !== 'story' || item.dead || item.deleted || !item.title) {
    return undefined
  }
  // a malformed submission URL falls back to the discussion page
  const domain = item.url ? hostname(item.url) : undefined
  const url = domain ? item.url! : discussionUrl(item.id)
  return {
    id: item.id,
    title: item.title,
    url,
    domain: domain ?? 'news.ycombinator.com',
    score: item.score ?? 0,
    comments: item.descendants ?? 0,
    postedAt: new Date((item.time ?? 0) * 1000),
    discussionUrl: discussionUrl(item.id),
  }
}

/** Reads the official Hacker News API (https://github.com/HackerNews/API). */
export class HackerNewsSource {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  private async get<T>(path: string): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}/${path}`)
    if (!response.ok) {
      throw new Error(`Hacker News API responded with ${response.status} for ${path}`)
    }
    return (await response.json()) as T
  }

  /** The current top stories, best first. */
  async topStories(limit: number): Promise<Story[]> {
    const ids = await this.get<number[]>('topstories.json')
    const items = await Promise.all(
      ids.slice(0, limit).map((id) => this.get<HackerNewsItem | null>(`item/${id}.json`))
    )
    return items.map(toStory).filter((story): story is Story => story !== undefined)
  }
}
