/** An item a channel can post, from any source. */
export interface Story {
  /** unique within its source, e.g. a Hacker News id or a feed item's guid */
  id: string
  title: string
  url: string
  /** where the link points, e.g. "github.com"; "news.ycombinator.com" for Ask HN */
  domain: string
  postedAt: Date
  /** a short text from the source, e.g. a feed item's description */
  excerpt?: string
  /** points, for sources that rank by votes */
  score?: number
  comments?: number
  /** where people discuss it, e.g. the Hacker News thread */
  discussionUrl?: string
  /** the publication it came from, e.g. "SZ München" */
  sourceName?: string
}

/** Where a channel gets its stories. */
export interface Source {
  /** the current stories, best or newest first */
  latest(limit: number): Promise<Story[]>
}

/** The host of a URL without "www.", or undefined for malformed URLs. */
export const hostname = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}
