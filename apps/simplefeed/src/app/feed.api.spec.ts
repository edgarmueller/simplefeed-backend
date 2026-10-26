import { INestApplication } from '@nestjs/common'
import { ApiClient, HACKER_NEWS, WorkerClient, bart, clearDatabase, createTestApp, item, lisa } from './test/helpers'

describe('feed api', () => {
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

  /** Bart subscribes to Hacker News, which picks two of three stories for him. */
  async function pickedFeed() {
    const token = await api.signUp(bart)
    const subscription = await api.subscribe(token, HACKER_NEWS)
    const [rust, crypto, sqlite] = await worker.storeItems(HACKER_NEWS, [
      item('1', 'Rust 2.0 is out', { score: 812 }),
      item('2', 'Bitcoin hits a new high', { score: 520 }),
      item('3', 'Why SQLite is so fast', { score: 290 }),
    ])
    await worker.pick(subscription.id, [{ itemId: sqlite.id, summary: 'A deep dive.' }, { itemId: rust.id }])
    return { token, subscription, rust, crypto, sqlite }
  }

  it('should store items once and refresh their points', async () => {
    await worker.storeItems(HACKER_NEWS, [item('1', 'Rust 2.0 is out', { score: 100 })])
    const [refreshed] = await worker.storeItems(HACKER_NEWS, [item('1', 'Rust 2.0 is out', { score: 812 })])

    expect(refreshed).toMatchObject({ title: 'Rust 2.0 is out', score: 812 })
  })

  it("should show a reader what their channels picked, best first, and not offer it again", async () => {
    const { token, subscription, crypto } = await pickedFeed()

    const feed = await api.getFeed(token)

    expect(feed.items.map((entry: { item: { title: string } }) => entry.item.title)).toEqual(['Why SQLite is so fast', 'Rust 2.0 is out'])
    expect(feed.items[0]).toMatchObject({ summary: 'A deep dive.', channel: { id: HACKER_NEWS, name: 'Hacker News' } })
    expect((await worker.candidates(subscription.id)).map((candidate: { id: string }) => candidate.id)).toEqual([crypto.id])
    expect(await worker.subscriptions(HACKER_NEWS)).toEqual([expect.objectContaining({ id: subscription.id, pickedSince: 2 })])
  })

  it('should keep read entries out of the unread feed and count the rest', async () => {
    const { token } = await pickedFeed()
    const [first] = (await api.getFeed(token)).items

    await api.markEntry(token, first.id, { read: true })

    expect((await api.getFeed(token)).items).toHaveLength(1)
    expect((await api.getFeed(token, { show: 'all' })).items).toHaveLength(2)
    expect((await api.getSubscriptions(token))[0]).toMatchObject({ unread: 1, lastPickedAt: expect.any(String) })

    await api.markAllRead(token, HACKER_NEWS)
    expect((await api.getFeed(token)).items).toEqual([])
    expect((await api.getSubscriptions(token))[0].unread).toBe(0)
  })

  it('should save entries for later and tell the channel what the reader liked', async () => {
    const { token } = await pickedFeed()
    const [sqlite, rust] = (await api.getFeed(token)).items

    await api.markEntry(token, rust.id, { liked: true })
    await api.markEntry(token, sqlite.id, { saved: true })

    expect((await api.getFeed(token, { show: 'saved' })).items.map((entry: { id: string }) => entry.id)).toEqual([sqlite.id])
    expect((await worker.subscriptions(HACKER_NEWS))[0].likedTitles).toEqual(['Rust 2.0 is out'])

    await api.markEntry(token, rust.id, { liked: false })
    expect((await worker.subscriptions(HACKER_NEWS))[0].likedTitles).toEqual([])
  })

  it("should keep readers' entries to themselves", async () => {
    const { token } = await pickedFeed()
    const lisaToken = await api.signUp(lisa)
    const [entry] = (await api.getFeed(token)).items

    expect((await api.getFeed(lisaToken)).items).toEqual([])
    await api.markEntry(lisaToken, entry.id, { read: true }, 404)
  })

  it('should offer new subscriptions to the worker until something was picked for them', async () => {
    const token = await api.signUp(bart)
    const subscription = await api.subscribe(token, HACKER_NEWS)
    const [story] = await worker.storeItems(HACKER_NEWS, [item('1', 'Rust 2.0 is out')])

    expect((await worker.fresh()).map((fresh: { id: string }) => fresh.id)).toEqual([subscription.id])

    await worker.pick(subscription.id, [{ itemId: story.id }])
    expect(await worker.fresh()).toEqual([])
  })
})
