import { ChatConnection, ChatMessage, SimplefeedClient } from '../api/simplefeed-client'
import { Source, Story } from '../sources/story'
import { InMemoryChannelStore } from '../state/store'
import { silentLogger, story } from '../test/fixtures'
import { RuleBasedCurator } from './curator'
import { Channel, formatPost } from './channel'
import { DEFAULT_PREFERENCES } from './preferences'
import { CommandTuner } from './tuning'

const NOW = new Date('2026-10-25T12:00:00Z')

function setup(stories: Story[], { failPosts = false, likes = [] as string[], conversations = [{ id: 'conv-1', userIds: ['use-1', 'use-channel'], messages: [] as ChatMessage[] }] } = {}) {
  const posts: string[] = []
  const client = {
    username: 'hackernews',
    post: async (body: string) => {
      if (failPosts) throw new Error('backend down')
      posts.push(body)
      return `pos-${posts.length}`
    },
    likesOnMyPosts: async () => likes.map((postId) => ({ postId, likedAt: NOW.toISOString() })),
    id: async () => 'use-channel',
    conversations: async () => conversations,
  } as unknown as SimplefeedClient
  const source: Source = { latest: async () => stories }
  const store = new InMemoryChannelStore()
  const channel = new Channel({
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
    ready: Promise.resolve(),
    join: async (id) => {
      joined.push(id)
    },
    send: async (_id, content) => {
      sent.push(content)
    },
    markAsRead: async () => undefined,
    close: () => undefined,
  }
  return { channel, store, posts, sent, joined, chat }
}

describe('Channel', () => {
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

  it('favors stories like the ones readers liked', async () => {
    const liked = story('Twelve years of distributed SQLite', { score: 300 })
    const popular = story('A popular essay', { score: 900 })
    const similar = story('SQLite is all you need', { score: 150 })
    // a reader liked an earlier post, which the channel remembers
    const { channel, store, posts } = setup([popular, similar], { likes: ['pos-1'] })
    await store.rememberPost('hackernews', 'pos-1', liked.title)
    await channel.postNewStories()

    // the best pick is posted last, so it shows on top
    expect(posts[posts.length - 1]).toContain('SQLite is all you need')
  })

  it('remembers what it posted, to learn from likes', async () => {
    const { channel, store } = setup([story('Rust 2.0 is out')])

    await channel.postNewStories()

    expect(await store.postTitles('hackernews', ['pos-1'])).toEqual(new Map([['pos-1', 'Rust 2.0 is out']]))
  })

  it('retries stories it failed to post', async () => {
    const pending = story('Try again')
    const failing = setup([pending], { failPosts: true })

    await failing.channel.postNewStories()

    expect(await failing.store.notPosted('hackernews', [pending.id])).toEqual([pending.id])
  })

  it("joins its subscribers' chats", async () => {
    const { channel, joined, chat } = setup([])

    await channel.syncChats(chat)

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
    await channel.syncChats(chat)

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


  it('posts feed items without points regardless of the minimum score', async () => {
    const item = story('Neue U-Bahn-Linie', { score: undefined, comments: undefined, discussionUrl: undefined })
    const { channel, posts } = setup([item])

    await channel.postNewStories()

    expect(posts).toHaveLength(1)
  })
})

describe('formatPost', () => {
  it('links the story and its discussion and escapes markdown in titles', () => {
    const body = formatPost({
      story: story('Show HN: [beta] *fast* parser', { id: '7', score: 321, comments: 45 }),
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

  it('names the publication for feed items, which have no points or discussion', () => {
    const body = formatPost({
      story: {
        id: 'https://sz.de/1',
        title: 'Neue U-Bahn-Linie',
        url: 'https://www.sueddeutsche.de/muenchen/u9',
        domain: 'sueddeutsche.de',
        postedAt: new Date(),
        sourceName: 'SZ München',
      },
    })

    expect(body).toBe(
      ['**[Neue U-Bahn-Linie](https://www.sueddeutsche.de/muenchen/u9)**', '', 'SZ München · sueddeutsche.de'].join('\n')
    )
  })

  it("uses the source's excerpt, shortened, when there is no summary", () => {
    const excerpt = `Die Stadt hat den Bau der U9 beschlossen. ${'Mehr dazu im Artikel. '.repeat(20)}`
    const body = formatPost({ story: story('Neue U-Bahn-Linie', { excerpt }) })
    const text = body.split('\n')[2]

    expect(text.startsWith('Die Stadt hat den Bau der U9 beschlossen.')).toBe(true)
    expect(text.length).toBeLessThanOrEqual(240)
    expect(text.endsWith('…')).toBe(true)
    expect(formatPost({ story: story('x', { excerpt }), summary: 'A summary.' }).split('\n')[2]).toBe('A summary.')
  })
})
