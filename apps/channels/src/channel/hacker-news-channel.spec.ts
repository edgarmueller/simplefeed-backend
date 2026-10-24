import { ChatConnection, ChatMessage, SimplefeedClient } from '../api/simplefeed-client'
import { HackerNewsSource, Story } from '../sources/hacker-news'
import { InMemoryChannelStore } from '../state/store'
import { silentLogger, story } from '../test/fixtures'
import { RuleBasedCurator } from './curator'
import { HackerNewsChannel, formatPost } from './hacker-news-channel'
import { DEFAULT_PREFERENCES } from './preferences'
import { CommandTuner } from './tuning'

const NOW = new Date('2026-10-25T12:00:00Z')

function setup(stories: Story[], { failPosts = false, conversations = [{ id: 'conv-1', userIds: ['use-1', 'use-channel'], messages: [] as ChatMessage[] }] } = {}) {
  const posts: string[] = []
  const accepted: string[] = []
  const client = {
    username: 'hackernews',
    post: async (body: string) => {
      if (failPosts) throw new Error('backend down')
      posts.push(body)
    },
    pendingFriendRequests: async () => [{ id: 'frq-1', from: { id: 'use-1', username: 'bart' } }],
    acceptFriendRequest: async (id: string) => {
      accepted.push(id)
    },
    id: async () => 'use-channel',
    conversations: async () => conversations,
  } as unknown as SimplefeedClient
  const source = { topStories: async () => stories } as unknown as HackerNewsSource
  const store = new InMemoryChannelStore()
  const channel = new HackerNewsChannel({
    client,
    source,
    curator: new RuleBasedCurator(),
    tuner: new CommandTuner(),
    store,
    logger: silentLogger,
    now: () => NOW,
  })
  const sent: string[] = []
  const joined: string[] = []
  const chat: ChatConnection = {
    join: async (id) => {
      joined.push(id)
    },
    send: async (_id, content) => {
      sent.push(content)
    },
    markAsRead: async () => undefined,
    close: () => undefined,
  }
  return { channel, store, posts, accepted, sent, joined, chat }
}

describe('HackerNewsChannel', () => {
  it('posts the best stories once, best last so it shows on top', async () => {
    const top = story('Top story', { score: 900 })
    const second = story('Second story', { score: 500 })
    const { channel, posts } = setup([second, top])

    await channel.postNewStories()
    await channel.postNewStories()

    expect(posts).toHaveLength(2)
    expect(posts[1]).toContain('Top story')
  })

  it('skips old and low-scoring stories', async () => {
    const old = story('Old news', { postedAt: new Date('2026-10-20T12:00:00Z') })
    const unpopular = story('Not yet popular', { score: 10 })
    const { channel, posts } = setup([old, unpopular])

    await channel.postNewStories()

    expect(posts).toHaveLength(0)
  })

  it('posts at most three stories per run, up to the daily limit', async () => {
    const stories = Array.from({ length: 10 }, (_, i) => story(`Story ${i}`))
    const { channel, store, posts } = setup(stories)
    await store.savePreferences('hackernews', { ...DEFAULT_PREFERENCES, maxPostsPerDay: 4 })

    await channel.postNewStories()
    expect(posts).toHaveLength(3)

    await channel.postNewStories()
    await channel.postNewStories()
    expect(posts).toHaveLength(4)
  })

  it('retries stories it failed to post', async () => {
    const pending = story('Try again')
    const failing = setup([pending], { failPosts: true })

    await failing.channel.postNewStories()

    expect(await failing.store.notPosted('hackernews', [String(pending.id)])).toEqual([String(pending.id)])
  })

  it('accepts subscribers and joins their chats', async () => {
    const { channel, accepted, joined, chat } = setup([])

    await channel.syncSubscribers(chat)

    expect(accepted).toEqual(['frq-1'])
    expect(joined).toEqual(['conv-1'])
  })

  it('answers messages it missed, oldest first, and each message only once', async () => {
    const message = (id: string, content: string, createdAt: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
      id, conversationId: 'conv-1', authorId: 'use-1', content, isRead: false, createdAt, ...extra,
    })
    const missed = [
      message('msg-2', 'more rust', '2026-10-25T10:01:00Z'),
      message('msg-1', 'mute crypto', '2026-10-25T10:00:00Z'),
      message('msg-0', 'an old reply', '2026-10-25T09:00:00Z', { authorId: 'use-channel' }),
      message('msg-old', 'already answered', '2026-10-25T08:00:00Z', { isRead: true }),
    ]
    const { channel, store, sent, chat } = setup([], {
      conversations: [{ id: 'conv-1', userIds: ['use-1', 'use-channel'], messages: missed }],
    })

    await channel.handleMessage(missed[0], chat)
    await channel.syncSubscribers(chat)

    expect(sent).toHaveLength(2)
    expect(sent[1]).toContain('Leaving out: crypto')
    expect((await store.getPreferences('hackernews'))?.interests).toEqual(['rust'])
  })

  it('answers a message again when the reply could not be sent', async () => {
    const { channel, sent, chat } = setup([])
    const message = { id: 'msg-1', conversationId: 'conv-1', authorId: 'use-1', content: 'more rust' }
    const disconnected = { ...chat, send: async () => Promise.reject(new Error('not connected')) }

    await expect(channel.handleMessage(message, disconnected)).rejects.toThrow('not connected')
    await channel.handleMessage(message, chat)

    expect(sent).toHaveLength(1)
  })

  it('applies chat requests to later posts', async () => {
    const crypto = story('Crypto is back', { score: 900 })
    const rust = story('Rust in production', { score: 300 })
    const { channel, posts, sent, chat } = setup([crypto, rust])

    await channel.handleMessage(
      { id: 'msg-1', conversationId: 'conv-1', authorId: 'use-1', content: 'mute crypto' },
      chat
    )
    await channel.postNewStories()

    expect(sent[0]).toContain('Leaving out: crypto')
    expect(posts.join()).not.toContain('Crypto is back')
    expect(posts.join()).toContain('Rust in production')
  })
})

describe('formatPost', () => {
  it('links the story and its discussion and escapes markdown in titles', () => {
    const body = formatPost({
      story: story('Show HN: [beta] *fast* parser', { id: 7, score: 321, comments: 45 }),
      summary: 'A parser.',
    })

    expect(body).toBe(
      [
        '**[Show HN: \\[beta\\] \\*fast\\* parser](https://example.com/7)**',
        '',
        'A parser.',
        '',
        '▲ 321 points · [45 comments](https://news.ycombinator.com/item?id=7) · example.com',
      ].join('\n')
    )
  })
})
