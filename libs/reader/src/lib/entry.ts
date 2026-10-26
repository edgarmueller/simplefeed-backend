import { Props, createId } from '@simplefeed/shared-ddd'
import { User } from '@simplefeed/user'
import { Item } from './item'
import { Subscription } from './subscription'

const createEntryId = createId('ent')

/** An item a channel picked for one reader, and what the reader did with it. */
export class Entry {
  readonly id: string
  userId: string
  /** only for the foreign key; not loaded */
  user?: User
  subscription: Subscription
  item: Item
  /** the curator's one-sentence summary, if it wrote one */
  summary?: string
  pickedAt: Date
  readAt?: Date
  likedAt?: Date
  savedAt?: Date

  static create(props: Props<Entry>, id?: string) {
    return Object.assign(new Entry(id), props)
  }

  private constructor(id?: string) {
    this.id = id || createEntryId()
  }

  mark({ read, liked, saved }: { read?: boolean; liked?: boolean; saved?: boolean }, now = new Date()) {
    if (read !== undefined) this.readAt = read ? (this.readAt ?? now) : null
    if (liked !== undefined) this.likedAt = liked ? (this.likedAt ?? now) : null
    if (saved !== undefined) this.savedAt = saved ? (this.savedAt ?? now) : null
  }
}
