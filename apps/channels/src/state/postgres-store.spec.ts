import { randomUUID } from 'crypto'
import { DEFAULT_PREFERENCES } from '../channel/preferences'
import { PostgresChannelStore } from './postgres-store'

// runs against the test database configured in .env.test
describe('PostgresChannelStore', () => {
  let store: PostgresChannelStore
  let channel: string

  beforeAll(async () => {
    store = await PostgresChannelStore.connect(process.env.DATABASE_URL!)
  })

  beforeEach(() => {
    channel = `test-${randomUUID()}`
  })

  afterAll(async () => {
    await store.close()
  })

  it('stores preferences', async () => {
    expect(await store.getPreferences(channel)).toBeUndefined()

    await store.savePreferences(channel, { ...DEFAULT_PREFERENCES, muted: ['crypto'] })
    await store.savePreferences(channel, { ...DEFAULT_PREFERENCES, muted: ['crypto', 'ai'] })

    expect((await store.getPreferences(channel))?.muted).toEqual(['crypto', 'ai'])
  })

  it('remembers posted items', async () => {
    const before = new Date(Date.now() - 1000)
    await store.markPosted(channel, ['1', '2'], new Date())
    await store.markPosted(channel, ['2'], new Date())

    expect(await store.notPosted(channel, ['1', '2', '3'])).toEqual(['3'])
    expect(await store.countPostedSince(channel, before)).toBe(2)
    expect(await store.countPostedSince(channel, new Date(Date.now() + 60_000))).toBe(0)
  })
})
