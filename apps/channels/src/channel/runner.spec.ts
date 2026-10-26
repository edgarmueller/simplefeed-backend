import { ChannelInfo, SubscriptionContext } from '../api/worker-api'
import { FakeWorkerApi } from '../test/fake-api'
import { silentLogger, story } from '../test/fixtures'
import { Source, Story } from '../sources/story'
import { RuleBasedCurator } from './curator'
import { DEFAULT_PREFERENCES, Preferences } from './preferences'
import { ChannelRunner } from './runner'

const NOW = new Date('2026-10-25T12:00:00Z')
const HN: ChannelInfo = { id: 'cha-hackernews', kind: 'hackernews', name: 'Hacker News', status: 'active' }

function setup(stories: Story[], subscriptions: Partial<SubscriptionContext>[] = [{}]) {
  const api = new FakeWorkerApi()
  api.subscriptionList = subscriptions.map((overrides, index) => ({
    id: `sub-${index + 1}`,
    channel: HN,
    preferences: DEFAULT_PREFERENCES,
    pickedSince: 0,
    likedTitles: [],
    ...overrides,
  }))
  const source: Source = { latest: async () => stories }
  const runner = new ChannelRunner({
    api: api.asApi(),
    curator: new RuleBasedCurator(),
    sourceFor: () => source,
    logger: silentLogger,
    now: () => NOW,
  })
  const titlesPickedFor = (subscriptionId: string) =>
    (api.picks[subscriptionId] ?? []).map((pick) => api.items.get(HN.id)?.find((item) => item.id === pick.itemId)?.title)
  return { api, runner, titlesPickedFor }
}

const prefs = (overrides: Partial<Preferences>) => ({ ...DEFAULT_PREFERENCES, ...overrides })

describe('ChannelRunner', () => {
  it("stores the channel's stories and picks the best for each reader, best first", async () => {
    const { api, runner, titlesPickedFor } = setup([story('Second story', { score: 500 }), story('Top story', { score: 900 })])

    await runner.run(HN)

    expect(api.items.get(HN.id)).toHaveLength(2)
    expect(titlesPickedFor('sub-1')).toEqual(['Top story', 'Second story'])
  })

  it("follows each reader's own preferences", async () => {
    const stories = [story('Crypto is back', { score: 900 }), story('Rust in production', { score: 300 })]
    const { runner, titlesPickedFor } = setup(stories, [
      { preferences: prefs({ muted: ['crypto'] }) },
      { preferences: prefs({ minScore: 500 }) },
    ])

    await runner.run(HN)

    expect(titlesPickedFor('sub-1')).toEqual(['Rust in production'])
    expect(titlesPickedFor('sub-2')).toEqual(['Crypto is back'])
  })

  it('skips old stories and picks at most three per run, within the daily limit', async () => {
    const old = story('Old news', { postedAt: new Date('2026-10-20T12:00:00Z') })
    const fresh = Array.from({ length: 6 }, (_, i) => story(`Story ${i}`))
    const { runner, titlesPickedFor } = setup([old, ...fresh], [{}, { pickedSince: 9 }])

    await runner.run(HN)

    expect(titlesPickedFor('sub-1')).toHaveLength(3)
    expect(titlesPickedFor('sub-1')).not.toContain('Old news')
    // one left of the default ten a day
    expect(titlesPickedFor('sub-2')).toHaveLength(1)
  })

  it('favors stories like the ones the reader liked', async () => {
    const { runner, titlesPickedFor } = setup(
      [story('A popular essay', { score: 900 }), story('SQLite is all you need', { score: 150 })],
      [{ likedTitles: ['Twelve years of distributed SQLite'] }]
    )

    await runner.run(HN)

    expect(titlesPickedFor('sub-1')[0]).toBe('SQLite is all you need')
  })

  it('picks for new subscribers right away, fetching a channel it has not fetched yet', async () => {
    const { api, runner, titlesPickedFor } = setup([story('Top story')])
    api.fresh = api.subscriptionList

    await runner.pickForFresh()

    expect(titlesPickedFor('sub-1')).toEqual(['Top story'])
  })

  it('keeps picking for the other readers when one fails', async () => {
    const { api, runner, titlesPickedFor } = setup([story('Top story')], [{}, {}])
    const candidates = api.candidates.bind(api)
    api.candidates = async (id, since) => {
      if (id === 'sub-1') throw new Error('API down')
      return candidates(id, since)
    }

    await runner.run(HN)

    expect(titlesPickedFor('sub-2')).toEqual(['Top story'])
  })
})
