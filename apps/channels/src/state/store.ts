import { Preferences } from '../channel/preferences'

/** What the channels remember between runs. */
export interface ChannelStore {
  /** stored preferences, or undefined if the channel has none yet */
  getPreferences(channel: string): Promise<Preferences | undefined>
  savePreferences(channel: string, preferences: Preferences): Promise<void>
  /** the ids from `itemIds` the channel has not posted yet */
  notPosted(channel: string, itemIds: string[]): Promise<string[]>
  markPosted(channel: string, itemIds: string[], postedAt: Date): Promise<void>
  countPostedSince(channel: string, since: Date): Promise<number>
}

export class InMemoryChannelStore implements ChannelStore {
  private readonly preferences = new Map<string, Preferences>()
  private readonly posted = new Map<string, Date>()

  private key = (channel: string, itemId: string) => `${channel}:${itemId}`

  async getPreferences(channel: string) {
    return this.preferences.get(channel)
  }

  async savePreferences(channel: string, preferences: Preferences) {
    this.preferences.set(channel, preferences)
  }

  async notPosted(channel: string, itemIds: string[]) {
    return itemIds.filter((id) => !this.posted.has(this.key(channel, id)))
  }

  async markPosted(channel: string, itemIds: string[], postedAt: Date) {
    for (const id of itemIds) {
      this.posted.set(this.key(channel, id), postedAt)
    }
  }

  async countPostedSince(channel: string, since: Date) {
    return [...this.posted.entries()].filter(([key, at]) => key.startsWith(`${channel}:`) && at >= since).length
  }
}
