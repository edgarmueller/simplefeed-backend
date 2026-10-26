import { ChannelInfo, StoredItem, SubscriptionContext, UnansweredMessage, WorkerApi, toStory } from '../api/worker-api'
import { Preferences } from '../channel/preferences'
import { Story } from '../sources/story'

/** An in-memory stand-in for the API's worker endpoints, recording what the worker does. */
export class FakeWorkerApi {
  channelList: ChannelInfo[] = []
  subscriptionList: SubscriptionContext[] = []
  items = new Map<string, StoredItem[]>()
  picks: Record<string, { itemId: string; summary?: string }[]> = {}
  activated: Record<string, unknown> = {}
  failed: Record<string, string> = {}
  messages: UnansweredMessage[] = []
  answers: Record<string, { reply: string; preferences: Preferences }> = {}
  fresh: SubscriptionContext[] = []

  asApi(): WorkerApi {
    return this as unknown as WorkerApi
  }

  async channels(statuses: string[]) {
    return this.channelList.filter((channel) => statuses.includes(channel.status))
  }

  async activate(channelId: string, found: { feedUrl: string; name: string }) {
    this.activated[channelId] = found
    const channel = this.channelList.find((c) => c.id === channelId)
    return { ...channel, ...found, status: 'active' } as ChannelInfo
  }

  async fail(channelId: string, error: string) {
    this.failed[channelId] = error
    return this.channelList.find((c) => c.id === channelId)
  }

  async storeItems(channelId: string, stories: Story[]) {
    const stored = stories.map((story) => ({ ...story, id: `itm-${story.id}`, publishedAt: story.postedAt.toISOString() }))
    this.items.set(channelId, stored)
    return stored
  }

  async subscriptions(channelId: string) {
    return this.subscriptionList.filter((subscription) => subscription.channel.id === channelId)
  }

  async freshSubscriptions() {
    return this.fresh
  }

  async candidates(subscriptionId: string, since: Date) {
    const subscription = this.subscriptionList.find((s) => s.id === subscriptionId)
    const picked = new Set((this.picks[subscriptionId] ?? []).map((pick) => pick.itemId))
    return (this.items.get(subscription?.channel.id ?? '') ?? [])
      .filter((item) => !picked.has(item.id) && new Date(item.publishedAt) >= since)
      .map(toStory)
  }

  async pick(subscriptionId: string, picks: { itemId: string; summary?: string }[]) {
    this.picks[subscriptionId] = [...(this.picks[subscriptionId] ?? []), ...picks]
  }

  async unansweredMessages() {
    return this.messages.filter((message) => !(message.id in this.answers))
  }

  async answer(messageId: string, reply: string, preferences: Preferences) {
    this.answers[messageId] = { reply, preferences }
  }
}
