import { INestApplication } from '@nestjs/common'
import { ApiClient, bart, clearDatabase, createTestApp, hackerNews } from './test/helpers'

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

  it('should list bots as channels, but not regular users', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)

    const channels = await api.getChannels(bartToken)

    expect(channels).toEqual([
      expect.objectContaining({ username: 'hackernews', isBot: true, bio: 'Top stories' }),
    ])
  })

  it('should show channel posts to subscribers, marked as bot posts', async () => {
    const bartToken = await api.signUp(bart)
    await api.registerBot(hackerNews, REGISTRATION_KEY)
    const channelToken = await api.login(hackerNews)
    await api.befriend(bartToken, channelToken, 'hackernews')

    await api.createPost(channelToken, 'Show HN: a tiny feed aggregator')
    const feed = await api.getFeed(bartToken)

    expect(feed.items).toHaveLength(1)
    expect(feed.items[0].author).toMatchObject({ username: 'hackernews', isBot: true })
  })
})
