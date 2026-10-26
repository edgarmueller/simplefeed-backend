import { Props, createId } from '@simplefeed/shared-ddd'
import { User } from '@simplefeed/user'
import { Channel } from './channel'
import { DEFAULT_PREFERENCES, Preferences, normalizePreferences } from './preferences'

const createSubscriptionId = createId('sub')

/** A reader following a channel, with their own preferences for it. */
export class Subscription {
  readonly id: string
  userId: string
  /** only for the foreign key; not loaded */
  user?: User
  channel: Channel
  preferences: Preferences
  createdAt?: Date

  static create(props: Omit<Props<Subscription>, 'preferences'> & { preferences?: Preferences }, id?: string) {
    return Object.assign(new Subscription(id), { preferences: DEFAULT_PREFERENCES, ...props })
  }

  private constructor(id?: string) {
    this.id = id || createSubscriptionId()
  }

  tune(preferences: unknown) {
    this.preferences = normalizePreferences(preferences, this.preferences)
  }
}
