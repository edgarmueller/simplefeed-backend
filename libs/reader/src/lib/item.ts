import { Props, createId } from '@simplefeed/shared-ddd'
import { Channel } from './channel'

const createItemId = createId('itm')

/** A story from a channel, stored once however many readers get it. */
export class Item {
  readonly id: string
  channel: Channel
  /** the source's own id, e.g. a Hacker News id or a feed item's guid */
  externalId: string
  title: string
  url: string
  domain: string
  excerpt?: string
  score?: number
  comments?: number
  discussionUrl?: string
  /** the publication, e.g. "SZ München" */
  sourceName?: string
  publishedAt: Date
  fetchedAt?: Date

  static create(props: Props<Item>, id?: string) {
    return Object.assign(new Item(id), props)
  }

  private constructor(id?: string) {
    this.id = id || createItemId()
  }
}
