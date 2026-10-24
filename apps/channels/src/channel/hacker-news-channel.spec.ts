import { ChatConnection, SimplefeedClient } from '../api/simplefeed-client'
import { HackerNewsSource, Story } from '../sources/hacker-news'
import { InMemoryChannelStore } from '../state/store'
import { silentLogger, story } from '../test/fixtures'
import { RuleBasedCurator } from './curator'
import { HackerNewsChannel, formatPost } from './hacker-news-channel'
import { DEFAULT_PREFERENCES } from './preferences'
import { CommandTuner } from './tuning'

const NOW = new Date('2026-10-25T12:00:00Z')

function setup(stories: Story[], { failPosts = false } = {}) {
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
    conversations: async () => [{ id: 'conv-1', userIds: ['use-1', 'use-2'] }],
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

    await channel.acceptSubscribers(chat)

    expect(accepted).toEqual(['frq-1'])
    expect(joined).toEqual(['conv-1'])
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
