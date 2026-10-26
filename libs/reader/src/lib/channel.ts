import { AggregateRoot, Props, createId } from '@simplefeed/shared-ddd'
import { InvalidFeedUrlError } from './errors/invalid-feed-url.error'

const createChannelId = createId('cha')

/** where a channel's items come from */
export type ChannelKind = 'hackernews' | 'feed'
/** a feed is pending until the worker has read it */
export type ChannelStatus = 'pending' | 'active' | 'failed'

const MAX_ERROR_LENGTH = 300

/**
 * Turns what a user typed into an http(s) URL, e.g. "sz.de/muenchen" into
 * "https://sz.de/muenchen".
 */
export function normalizeFeedUrl(input: string): string {
  const trimmed = input.trim()
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    throw new InvalidFeedUrlError(input)
  }
  // a host without a dot is most likely a typo; localhost and IPv6 literals are fine,
  // and the worker refuses private addresses unless configured for development
  const plausibleHost = url.hostname.includes('.') || url.hostname === 'localhost' || url.hostname.startsWith('[')
  if (!['http:', 'https:'].includes(url.protocol) || !plausibleHost) {
    throw new InvalidFeedUrlError(input)
  }
  url.hash = ''
  return url.toString()
}

/** A source of items readers can subscribe to: Hacker News, or any RSS or Atom feed. */
export class Channel extends AggregateRoot {
  kind: ChannelKind
  /** what the channel is called, once known; e.g. the feed's title */
  name?: string
  description?: string
  /** for feeds: the address as added, normalized: a feed or a website that links to one */
  url?: string
  /** for feeds: the feed found at `url` */
  feedUrl?: string
  siteUrl?: string
  status: ChannelStatus
  /** why the feed couldn't be read */
  error?: string
  createdAt?: Date
  updatedAt?: Date

  static create(props: Props<Channel>, id?: string): Channel {
    return new Channel(props, id)
  }

  /** A feed someone added; the worker reads it before it posts anything. */
  static feed(url: string): Channel {
    return new Channel({ kind: 'feed', url: normalizeFeedUrl(url), status: 'pending' })
  }

  private constructor(props: Props<Channel>, id?: string) {
    super(props, id || createChannelId())
  }

  activate({ feedUrl, name, description, siteUrl }: { feedUrl: string; name: string; description?: string; siteUrl?: string }) {
    this.feedUrl = feedUrl
    this.name = name
    this.description = description ?? null
    this.siteUrl = siteUrl ?? null
    this.status = 'active'
    this.error = null
  }

  fail(error: string) {
    this.status = 'failed'
    this.error = error.slice(0, MAX_ERROR_LENGTH)
  }

  /** Adding a failed feed again gives it another try. */
  retry() {
    if (this.status === 'failed') {
      this.status = 'pending'
      this.error = null
    }
  }
}
