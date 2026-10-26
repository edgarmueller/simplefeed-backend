import { Account, ChatConnection, ChatMessage, SimplefeedClient } from '../api/simplefeed-client'
import { Logger } from '../logger'
import { Source, Story } from '../sources/story'
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

/** how many stories to look at per run */
const CANDIDATE_COUNT = 60
/** by default, stories older than this are no longer news */
const DEFAULT_MAX_AGE_MS = 48 * 60 * 60 * 1000
/** spreads a day's posts over several runs */
const MAX_POSTS_PER_RUN = 3
/** how many liked stories to learn from */
const MAX_LIKED = 20

const escapeMarkdown = (text: string) => text.replace(/([[\]*_`\\])/g, '\\$1')

/** the longest excerpt from the source posted in place of a summary */
const MAX_EXCERPT_IN_POST = 240

const shorten = (text: string, max: number) => {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > max / 2 ? cut.lastIndexOf(' ') : cut.length)}…`
}

/**
 * A linked title, a summary, and a line about the source. Without a
 * summary from the curator, the source's own excerpt stands in.
 */
export function formatPost({ story, summary }: Pick): string {
  const lines = [`**[${escapeMarkdown(story.title)}](${story.url})**`]
  const text = summary ?? (story.excerpt ? shorten(story.excerpt, MAX_EXCERPT_IN_POST) : undefined)
  if (text) {
    lines.push('', escapeMarkdown(text))
  }
  const about: string[] = []
  if (story.score !== undefined) {
    about.push(`▲ ${story.score} points`)
  }
  if (story.discussionUrl) {
    about.push(`[${story.comments ?? 0} comments](${story.discussionUrl})`)
  }
  if (story.sourceName && story.sourceName !== story.domain) {
    about.push(escapeMarkdown(story.sourceName))
  }
  about.push(story.domain)
  lines.push('', about.join(' · '))
  return lines.join('\n')
}

export interface ChannelDependencies {
  client: SimplefeedClient
  source: Source
  curator: Curator
  tuner: Tuner
  store: ChannelStore
  logger?: Logger
  now?: () => Date
  /** stories older than this are skipped; feeds that post rarely want longer */
  maxAgeMs?: number
}

/** Posts the best new stories from its source and is tuned by chatting with it. */
export class Channel {
  private readonly logger: Logger
  private readonly now: () => Date
  /** messages answered already, as they can arrive both live and when catching up */
  private readonly answered = new Set<string>()

  constructor(private readonly deps: ChannelDependencies) {
    this.logger = deps.logger ?? console
    this.now = deps.now ?? (() => new Date())
  }

  get name() {
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

    const stories = await this.deps.source.latest(CANDIDATE_COUNT)
    const maxAgeMs = this.deps.maxAgeMs ?? DEFAULT_MAX_AGE_MS
    // stories that weren't picked get another chance in later runs, e.g. once they rise
    const eligible = stories.filter(
      (story) =>
        // only stories with points can be too low-scoring
        (story.score === undefined || story.score >= preferences.minScore) &&
        this.now().getTime() - story.postedAt.getTime() < maxAgeMs
    )
    const notPosted = new Set(await this.deps.store.notPosted(this.name, eligible.map((story) => story.id)))
    const candidates = eligible.filter((story) => notPosted.has(story.id))
    const picks = await this.deps.curator.pick(
      candidates,
      preferences,
      Math.min(remainingToday, MAX_POSTS_PER_RUN),
      await this.likedTitles()
    )

    const posted: Story[] = []
    // the feed shows the newest post first, so post the best pick last
    for (const pick of [...picks].reverse()) {
      try {
        const postId = await this.deps.client.post(formatPost(pick))
        // remember each post right away, so a crash can't post it twice
        await this.deps.store.markPosted(this.name, [pick.story.id], this.now())
        await this.deps.store.rememberPost(this.name, postId, pick.story.title)
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

  /** Titles of the channel's posts that readers liked, most recent first. */
  async likedTitles(): Promise<string[]> {
    try {
      const likes = await this.deps.client.likesOnMyPosts()
      const postIds = [...new Set(likes.map((like) => like.postId))]
      const titles = await this.deps.store.postTitles(this.name, postIds)
      return postIds.flatMap((id) => titles.get(id) ?? []).slice(0, MAX_LIKED)
    } catch (error) {
      // likes refine the picks; posting works without them
      this.logger.warn(`could not read likes: ${error}`)
      return []
    }
  }

  /**
   * Joins the chats of new subscribers and answers messages that arrived
   * while the channel wasn't listening, e.g. before it had joined a new
   * subscriber's conversation.
   */
  async syncChats(chat: ChatConnection): Promise<void> {
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
