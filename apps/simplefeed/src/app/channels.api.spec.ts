import { INestApplication } from '@nestjs/common'
import { ApiClient, bart, clearDatabase, createTestApp, hackerNews, lisa } from './test/helpers'

const REGISTRATION_KEY = 'test-bot-registration-key'

describe('channels api', () => {
  let app: INestApplication
  let api: ApiClient

  beforeAll(async () => {
    app = await createTestApp()
    api = new ApiClient(app)
  })

  beforeEach(async () => {
    await clearDatabase(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('should not register bots without the registration key', async () => {
    await api.registerBot(hackerNews, undefined, 403)
    await api.registerBot(hackerNews, 'wrong-key-of-same-length!', 403)
  })

  it('should register channels named after a single title', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot({ ...hackerNews, username: 'heise', firstName: 'heise online', lastName: undefined as unknown as string }, REGISTRATION_KEY)

    expect(await api.getChannels(bartToken)).toEqual([expect.objectContaining({ username: 'heise', firstName: 'heise online', lastName: '' })])
  })

  it('should list bots as channels, but not regular users', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)

    const channels = await api.getChannels(bartToken)

    expect(channels).toEqual([
      expect.objectContaining({ username: 'hackernews', isBot: true, bio: 'Top stories', subscribed: false }),
    ])
  })

  it('should subscribe right away, and only once', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)

    const channel = await api.subscribe(bartToken, 'hackernews')
    await api.subscribe(bartToken, 'hackernews')

    expect(channel).toMatchObject({ username: 'hackernews', subscribed: true })
    expect((await api.getChannels(bartToken))[0].subscribed).toBe(true)
    expect((await api.getMe(bartToken)).subscriptions).toEqual([expect.objectContaining({ username: 'hackernews' })])
  })

  it('should open a chat with the channel when subscribing', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)

    await api.subscribe(bartToken, 'hackernews')

    // the conversation is created after the subscription is committed
    await expect.poll(() => api.getConversations(bartToken)).toHaveLength(1)
  })

  it('should unsubscribe', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)
    await api.subscribe(bartToken, 'hackernews')

    await api.unsubscribe(bartToken, 'hackernews')

    expect((await api.getChannels(bartToken))[0].subscribed).toBe(false)
    expect((await api.getMe(bartToken)).subscriptions).toEqual([])
  })

  it('should not subscribe to regular users', async () => {
    const bartToken = await api.signUp(bart)
    await api.signUp(lisa)

    await api.subscribe(bartToken, 'lisa', 400)
    await api.subscribe(bartToken, 'nobody', 404)
  })

  it('should show channel posts to subscribers, marked as bot posts', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)
    const channelToken = await api.login(hackerNews)
    await api.subscribe(bartToken, 'hackernews')

    await api.createPost(channelToken, 'Show HN: a tiny feed aggregator')
    const feed = await api.getFeed(bartToken)

    expect(feed.items).toHaveLength(1)
    expect(feed.items[0].author).toMatchObject({ username: 'hackernews', isBot: true })
  })

  it("should tell a channel which of its posts readers liked", async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)
    const channelToken = await api.login(hackerNews)
    await api.subscribe(bartToken, 'hackernews')
    const liked = await api.createPost(channelToken, 'Rust 2.0 is out')
    const unliked = await api.createPost(channelToken, 'Bitcoin hits a new high')
    await api.createPost(channelToken, 'Show HN: a job queue')

    await api.likePost(bartToken, liked.id)
    await api.likePost(bartToken, unliked.id)
    await api.unlikePost(bartToken, unliked.id)

    expect(await api.getLikesOnMyPosts(channelToken)).toEqual([
      { postId: liked.id, likedAt: expect.any(String) },
    ])
    // only the author learns about likes on their posts
    expect(await api.getLikesOnMyPosts(bartToken)).toEqual([])
  })
})
