import { AggregateRoot, Props, createId } from '@simplefeed/shared-ddd'
import { User } from '@simplefeed/user'
import { FeedActivated } from './events/feed-activated.event'
import { InvalidFeedUrlError } from './errors/invalid-feed-url.error'

const PREFIX = 'fee'
const createFeedId = createId(PREFIX)

export type FeedStatus = 'pending' | 'active' | 'failed'

/** The longest error message kept for a feed that couldn't be read. */
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
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) {
    throw new InvalidFeedUrlError(input)
  }
  url.hash = ''
  return url.toString()
}

/**
 * A feed someone added. It stays pending until the channels worker has read
 * it and created a channel for it; then everyone who asked for it is
 * subscribed to that channel.
 */
export class Feed extends AggregateRoot {
  /** the URL as added, normalized: a feed or a website that links to one */
  url: string
  /** the feed found at `url` */
  feedUrl?: string
  title?: string
  status: FeedStatus
  /** why the feed couldn't be read, if it failed */
  error?: string
  /** the channel that posts the feed's items, once active */
  channel?: User
  /** users waiting for the feed to become a channel */
  requesters?: User[]
  createdAt?: Date
  updatedAt?: Date

  static request(url: string, requestedBy: User): Feed {
    return new Feed({ url: normalizeFeedUrl(url), status: 'pending', requesters: [requestedBy] })
  }

  static create(props: Props<Feed>, id?: string): Feed {
    return new Feed(props, id)
  }

  private constructor(props: Props<Feed>, id?: string) {
    super(props, id || createFeedId())
  }

  /** Someone else asked for the same feed; a failed feed gets another try. */
  requestAgain(requestedBy: User) {
    if (!this.requesters?.some((user) => user.id === requestedBy.id)) {
      this.requesters = [...(this.requesters ?? []), requestedBy]
    }
    if (this.status === 'failed') {
      this.status = 'pending'
      this.error = null
    }
  }

  activate(channel: User, feedUrl: string, title: string) {
    if (!channel.profile.isBot) {
      throw new Error(`${channel.profile.username} is not a channel`)
    }
    const subscribers = this.requesters ?? []
    this.channel = channel
    this.feedUrl = feedUrl
    this.title = title
    this.status = 'active'
    this.error = null
    this.requesters = []
    this.emitDomainEvent(new FeedActivated(this, subscribers))
  }

  fail(error: string) {
    this.status = 'failed'
    this.error = error.slice(0, MAX_ERROR_LENGTH)
  }

  /** The user no longer wants the feed, e.g. to dismiss one that failed. */
  withdraw(user: User) {
    this.requesters = this.requesters?.filter((requester) => requester.id !== user.id)
  }
}
