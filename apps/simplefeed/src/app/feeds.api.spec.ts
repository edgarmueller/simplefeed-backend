import { INestApplication } from '@nestjs/common'
import { ApiClient, TestUser, bart, clearDatabase, createTestApp, lisa } from './test/helpers'

const KEY = 'test-bot-registration-key'

const sz: TestUser = {
  username: 'sz-muenchen',
  firstName: 'SZ',
  lastName: 'München',
  email: 'sz-muenchen@channels.example.com',
  password: 'channel-secret',
}

describe('feeds api', () => {
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

  const subscriptionsOf = async (token: string) =>
    (await api.getMe(token)).subscriptions.map((channel: { username: string }) => channel.username)

  it('should subscribe everyone who added a feed once the worker made it a channel', async () => {
    const bartToken = await api.signUp(bart)
    const lisaToken = await api.signUp(lisa)

    const added = await api.addFeed(bartToken, 'sz.de/muenchen')
    await api.addFeed(lisaToken, 'https://sz.de/muenchen')

    expect(added).toMatchObject({ url: 'https://sz.de/muenchen', status: 'pending' })
    expect(await api.getMyFeeds(bartToken)).toEqual([expect.objectContaining({ id: added.id, status: 'pending' })])
    expect(await api.getWorkerFeeds(KEY)).toEqual([expect.objectContaining({ id: added.id })])

    await api.registerBot(sz, KEY)
    const activated = await api.activateFeed(KEY, added.id, {
      feedUrl: 'https://rss.sueddeutsche.de/rss/Muenchen',
      title: 'SZ München',
      channelUsername: 'sz-muenchen',
    })

    expect(activated).toMatchObject({ status: 'active', channel: { username: 'sz-muenchen' } })
    // subscribing happens after the activation is committed
    await expect.poll(() => subscriptionsOf(bartToken)).toEqual(['sz-muenchen'])
    await expect.poll(() => subscriptionsOf(lisaToken)).toEqual(['sz-muenchen'])
    expect(await api.getMyFeeds(bartToken)).toEqual([])
    expect(await api.getWorkerFeeds(KEY, 'active')).toEqual([expect.objectContaining({ id: added.id })])
  })

  it('should subscribe right away to a feed that is a channel already', async () => {
    const bartToken = await api.signUp(bart)
    const lisaToken = await api.signUp(lisa)
    const feed = await api.addFeed(bartToken, 'sz.de/muenchen')
    await api.registerBot(sz, KEY)
    await api.activateFeed(KEY, feed.id, {
      feedUrl: 'https://rss.sueddeutsche.de/rss/Muenchen',
      title: 'SZ München',
      channelUsername: 'sz-muenchen',
    })

    // by the feed's own address this time
    const added = await api.addFeed(lisaToken, 'https://rss.sueddeutsche.de/rss/Muenchen')

    expect(added).toMatchObject({ status: 'active' })
    expect(await subscriptionsOf(lisaToken)).toEqual(['sz-muenchen'])
  })

  it('should merge a feed into the channel that already posts it', async () => {
    const bartToken = await api.signUp(bart)
    const lisaToken = await api.signUp(lisa)
    const first = await api.addFeed(bartToken, 'sz.de/muenchen')
    const second = await api.addFeed(lisaToken, 'sueddeutsche.de/muenchen')
    await api.registerBot(sz, KEY)
    const activation = { feedUrl: 'https://rss.sueddeutsche.de/rss/Muenchen', title: 'SZ München', channelUsername: 'sz-muenchen' }
    await api.activateFeed(KEY, first.id, activation)

    const merged = await api.activateFeed(KEY, second.id, activation)

    expect(merged.id).toBe(first.id)
    await expect.poll(() => subscriptionsOf(lisaToken)).toEqual(['sz-muenchen'])
    expect(await api.getWorkerFeeds(KEY, 'pending,active')).toHaveLength(1)
  })

  it('should show failed feeds until the user dismisses them, and retry when added again', async () => {
    const bartToken = await api.signUp(bart)
    const feed = await api.addFeed(bartToken, 'example.com/blog')

    await api.failFeed(KEY, feed.id, 'no feed found at https://example.com/blog')

    expect(await api.getMyFeeds(bartToken)).toEqual([
      expect.objectContaining({ status: 'failed', error: 'no feed found at https://example.com/blog' }),
    ])
    expect((await api.addFeed(bartToken, 'example.com/blog')).status).toBe('pending')

    await api.withdrawFeed(bartToken, feed.id)
    expect(await api.getMyFeeds(bartToken)).toEqual([])
  })

  it('should reject what is not a web address', async () => {
    const bartToken = await api.signUp(bart)

    await api.addFeed(bartToken, 'not a url', 400)
    await api.addFeed(bartToken, 'javascript:alert(1)', 400)
  })

  it('should keep the worker endpoints to the worker', async () => {
    await api.getWorkerFeeds(undefined, 'pending', 403)
    await api.getWorkerFeeds('wrong-key-of-same-length!', 'pending', 403)
  })
})
