import { Account, ChatConnection, ChatMessage, SimplefeedClient } from '../api/simplefeed-client'
import { Logger } from '../logger'
import { HackerNewsSource, Story } from '../sources/hacker-news'
import { ChannelStore } from '../state/store'
import { Curator, Pick } from './curator'
import { DEFAULT_PREFERENCES, Preferences } from './preferences'
import { Tuner } from './tuning'

export const HACKER_NEWS_ACCOUNT: Account = {
  username: 'hackernews',
  firstName: 'Hacker',
  lastName: 'News',
  email: 'hackernews@channels.simplefeed.local',
  bio: "The Hacker News front page, picked for you. Message me to tune what I post.",
}

/** how many top stories to look at per run */
const CANDIDATE_COUNT = 60
/** stories older than this are no longer news */
const MAX_AGE_MS = 48 * 60 * 60 * 1000
/** spreads a day's posts over several runs */
const MAX_POSTS_PER_RUN = 3

const escapeMarkdown = (text: string) => text.replace(/([[\]*_`\\])/g, '\\$1')

export function formatPost({ story, summary }: Pick): string {
  const lines = [`**[${escapeMarkdown(story.title)}](${story.url})**`]
  if (summary) {
    lines.push('', escapeMarkdown(summary))
  }
  lines.push('', `▲ ${story.score} points · [${story.comments} comments](${story.discussionUrl}) · ${story.domain}`)
  return lines.join('\n')
}

export interface HackerNewsChannelDependencies {
  client: SimplefeedClient
  source: HackerNewsSource
  curator: Curator
  tuner: Tuner
  store: ChannelStore
  logger?: Logger
  now?: () => Date
}

export class HackerNewsChannel {
  private readonly logger: Logger
  private readonly now: () => Date
  /** messages answered already, as they can arrive both live and when catching up */
  private readonly answered = new Set<string>()

  constructor(private readonly deps: HackerNewsChannelDependencies) {
    this.logger = deps.logger ?? console
    this.now = deps.now ?? (() => new Date())
  }

  private get name() {
    return this.deps.client.username
  }

  async preferences(): Promise<Preferences> {
    return (await this.deps.store.getPreferences(this.name)) ?? DEFAULT_PREFERENCES
  }

  /** Posts the best new stories, within the subscriber's daily limit. */
  async postNewStories(): Promise<Story[]> {
    const preferences = await this.preferences()
    const startOfDay = new Date(this.now())
    startOfDay.setHours(0, 0, 0, 0)
    const remainingToday =
      preferences.maxPostsPerDay - (await this.deps.store.countPostedSince(this.name, startOfDay))
    if (remainingToday <= 0) {
      return []
    }

    const stories = await this.deps.source.topStories(CANDIDATE_COUNT)
    // stories that weren't picked get another chance in later runs, e.g. once they rise
    const eligible = stories.filter(
      (story) =>
        story.score >= preferences.minScore && this.now().getTime() - story.postedAt.getTime() < MAX_AGE_MS
    )
    const notPosted = new Set(
      await this.deps.store.notPosted(this.name, eligible.map((story) => String(story.id)))
    )
    const candidates = eligible.filter((story) => notPosted.has(String(story.id)))
    const picks = await this.deps.curator.pick(
      candidates,
      preferences,
      Math.min(remainingToday, MAX_POSTS_PER_RUN)
    )

    const posted: Story[] = []
    // the feed shows the newest post first, so post the best pick last
    for (const pick of [...picks].reverse()) {
      try {
        await this.deps.client.post(formatPost(pick))
        // remember each post right away, so a crash can't post it twice
        await this.deps.store.markPosted(this.name, [String(pick.story.id)], this.now())
        posted.push(pick.story)
      } catch (error) {
        this.logger.error(`could not post story ${pick.story.id}: ${error}`)
      }
    }
    if (posted.length > 0) {
      this.logger.log(`${this.name} posted ${posted.length} of ${candidates.length} new stories`)
    }
    return posted
  }

  /**
   * Accepts pending subscriptions, joins their chats and answers messages
   * that arrived while the channel wasn't listening, e.g. before it had
   * joined a new conversation.
   */
  async syncSubscribers(chat: ChatConnection): Promise<void> {
    const requests = await this.deps.client.pendingFriendRequests()
    for (const request of requests) {
      await this.deps.client.acceptFriendRequest(request.id)
      this.logger.log(`${this.name} accepted ${request.from.username} as a subscriber`)
    }
    // accepting creates the conversation asynchronously, so join whatever exists by now
    const conversations = await this.deps.client.conversations()
    const ownId = await this.deps.client.id()
    for (const conversation of conversations) {
      await chat.join(conversation.id)
      const unread = conversation.messages
        .filter((message) => message.authorId !== ownId && !message.isRead)
        .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
      for (const message of unread) {
        await this.handleMessage(message, chat)
      }
    }
  }

  /** Answers a subscriber's message and applies what they asked for. */
  async handleMessage(message: ChatMessage, chat: ChatConnection): Promise<void> {
    if (this.answered.has(message.id)) {
      return
    }
    this.answered.add(message.id)
    try {
      const current = await this.preferences()
      const { preferences, reply } = await this.deps.tuner.tune(message.content, current)
      if (JSON.stringify(preferences) !== JSON.stringify(current)) {
        await this.deps.store.savePreferences(this.name, preferences)
      }
      await chat.markAsRead(message.conversationId)
      await chat.send(message.conversationId, reply)
    } catch (error) {
      // the message stays unread, so the next sync answers it
      this.answered.delete(message.id)
      throw error
    }
  }
}
