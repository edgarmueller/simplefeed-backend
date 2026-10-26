import { INestApplication } from '@nestjs/common'
import { ApiClient, HACKER_NEWS, WorkerClient, bart, clearDatabase, createTestApp, lisa } from './test/helpers'

const SZ_FEED = 'https://rss.sueddeutsche.de/rss/Muenchen'

describe('channels api', () => {
  let app: INestApplication
  let api: ApiClient
  let worker: WorkerClient

  beforeAll(async () => {
    app = await createTestApp()
    api = new ApiClient(app)
    worker = new WorkerClient(app)
  })

  beforeEach(async () => {
    await clearDatabase(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list Hacker News, built in, and subscribe right away and only once', async () => {
    const bartToken = await api.signUp(bart)

    expect(await api.getChannels(bartToken)).toEqual([
      expect.objectContaining({ id: HACKER_NEWS, kind: 'hackernews', name: 'Hacker News', status: 'active', subscribed: false }),
    ])

    const subscription = await api.subscribe(bartToken, HACKER_NEWS)
    await api.subscribe(bartToken, HACKER_NEWS)

    expect(subscription).toMatchObject({ channel: { id: HACKER_NEWS }, preferences: { minScore: 100, maxPostsPerDay: 10 } })
    expect((await api.getChannels(bartToken))[0].subscribed).toBe(true)
    expect(await api.getSubscriptions(bartToken)).toEqual([expect.objectContaining({ id: subscription.id, unread: 0 })])

    await api.unsubscribe(bartToken, HACKER_NEWS)
    expect(await api.getSubscriptions(bartToken)).toEqual([])
  })

  it('should keep a new feed pending until the worker made it a channel', async () => {
    const bartToken = await api.signUp(bart)
    const lisaToken = await api.signUp(lisa)

    const added = await api.addFeed(bartToken, 'sz.de/muenchen')
    expect(added.channel).toMatchObject({ url: 'https://sz.de/muenchen', status: 'pending', kind: 'feed' })
    // pending feeds aren't in the catalog yet, but are among the reader's subscriptions
    expect((await api.getChannels(bartToken)).map((c: { id: string }) => c.id)).toEqual([HACKER_NEWS])
    expect(await worker.channels('pending')).toEqual([expect.objectContaining({ id: added.channel.id })])

    await worker.activate(added.channel.id, { feedUrl: SZ_FEED, name: 'SZ München', description: 'Nachrichten aus München' })

    expect((await api.getSubscriptions(bartToken))[0].channel).toMatchObject({ status: 'active', name: 'SZ München' })
    // anyone adding it again, by either address, is subscribed to the same channel
    const again = await api.addFeed(lisaToken, SZ_FEED)
    expect(again.channel).toMatchObject({ id: added.channel.id, status: 'active' })
  })

  it('should merge a feed found at a second address into the channel posting it', async () => {
    const bartToken = await api.signUp(bart)
    const lisaToken = await api.signUp(lisa)
    const first = await api.addFeed(bartToken, 'sz.de/muenchen')
    const second = await api.addFeed(lisaToken, 'sueddeutsche.de/muenchen')
    await worker.activate(first.channel.id, { feedUrl: SZ_FEED, name: 'SZ München' })

    const merged = await worker.activate(second.channel.id, { feedUrl: SZ_FEED, name: 'SZ München' })

    expect(merged.id).toBe(first.channel.id)
    expect((await api.getSubscriptions(lisaToken)).map((s: { channel: { id: string } }) => s.channel.id)).toEqual([first.channel.id])
    expect(await worker.channels('pending,active,failed')).toHaveLength(2)
  })

  it('should show why a feed failed, retry when added again, and forget it when nobody wants it', async () => {
    const bartToken = await api.signUp(bart)
    const added = await api.addFeed(bartToken, 'example.com/blog')

    await worker.fail(added.channel.id, 'no feed found at https://example.com/blog')

    expect((await api.getSubscriptions(bartToken))[0].channel).toMatchObject({
      status: 'failed',
      error: 'no feed found at https://example.com/blog',
    })
    expect((await api.addFeed(bartToken, 'example.com/blog')).channel.status).toBe('pending')

    await api.unsubscribe(bartToken, added.channel.id)
    expect(await worker.channels('pending,failed')).toEqual([])
  })

  it('should reject what is not a web address, and unknown channels', async () => {
    const bartToken = await api.signUp(bart)

    await api.addFeed(bartToken, 'not a url', 400)
    await api.addFeed(bartToken, 'javascript:alert(1)', 400)
    await api.subscribe(bartToken, 'cha-unknown', 404)
  })

  it('should keep the worker api to the worker', async () => {
    await new WorkerClient(app, '').channels('active', 403)
    await new WorkerClient(app, 'wrong-key-of-the-same-length').channels('active', 403)
  })
})
