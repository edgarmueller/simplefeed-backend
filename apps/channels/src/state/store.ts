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
  /** remembers what a post was about, to learn from readers' likes */
  rememberPost(channel: string, postId: string, title: string): Promise<void>
  /** the titles of the given posts, for the ones the channel remembers */
  postTitles(channel: string, postIds: string[]): Promise<Map<string, string>>
}

export class InMemoryChannelStore implements ChannelStore {
  private readonly preferences = new Map<string, Preferences>()
  private readonly posted = new Map<string, Date>()
  private readonly titles = new Map<string, string>()

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

  async rememberPost(channel: string, postId: string, title: string) {
    this.titles.set(this.key(channel, postId), title)
  }

  async postTitles(channel: string, postIds: string[]) {
    const titles = new Map<string, string>()
    for (const id of postIds) {
      const title = this.titles.get(this.key(channel, id))
      if (title !== undefined) {
        titles.set(id, title)
      }
    }
    return titles
  }
}
