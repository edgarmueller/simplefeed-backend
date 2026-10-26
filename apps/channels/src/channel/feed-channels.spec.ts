import { Account, SimplefeedClient } from '../api/simplefeed-client'
import { FeedRequest, WorkerApi } from '../api/worker-api'
import { PageFetcher } from '../sources/safe-fetch'
import { silentLogger } from '../test/fixtures'
import { FeedChannels, feedAccount } from './feed-channels'

const RSS = `<rss version="2.0"><channel><title>SZ München</title><description>Nachrichten aus München</description>
  <item><title>Neue U-Bahn-Linie</title><link>https://www.sueddeutsche.de/muenchen/u9</link></item>
</channel></rss>`

describe('feedAccount', () => {
  it('names the account after the title, unique per feed', () => {
    const account = feedAccount('https://rss.sueddeutsche.de/rss/Muenchen', 'SZ München', 'Nachrichten aus München')

    expect(account).toMatchObject({ firstName: 'SZ München', lastName: '', bio: 'Nachrichten aus München' })
    expect(account.username).toMatch(/^sz-munchen-[0-9a-f]{6}$/)
    expect(account.email).toBe(`${account.username}@channels.simplefeed.local`)
    expect(feedAccount('https://rss.sueddeutsche.de/rss/Muenchen', 'SZ München').username).toBe(account.username)
    expect(feedAccount('https://other.example.com/rss', 'SZ München').username).not.toBe(account.username)
  })

  it('falls back to the host for feeds without a description or usable title', () => {
    expect(feedAccount('https://blog.example.com/feed', '★★★')).toMatchObject({
      username: expect.stringMatching(/^feed-[0-9a-f]{6}$/),
      bio: 'Posts from blog.example.com.',
    })
  })
})

describe('FeedChannels', () => {
  function setup(feeds: FeedRequest[], { failAccountFor = '' } = {}) {
    const failed: Record<string, string> = {}
    const activated: Record<string, unknown> = {}
    const registered: Account[] = []
    const started: string[] = []
    const api = {
      feeds: async (statuses: string[]) => feeds.filter((feed) => statuses.includes(feed.status)),
      failFeed: async (id: string, error: string) => {
        failed[id] = error
      },
      activateFeed: async (id: string, activation: unknown) => {
        activated[id] = activation
      },
    } as unknown as WorkerApi
    const pages: Record<string, string> = {
      'https://sz.example.com/': '<html><link rel="alternate" type="application/rss+xml" href="/rss"></html>',
      'https://sz.example.com/rss': RSS,
      'https://nofeed.example.com/': '<html></html>',
      'https://other.example.com/feed': RSS.replace('SZ München', 'Other News'),
    }
    const fetchPage: PageFetcher = async (url) => {
      if (!(url in pages)) throw new Error(`${url} responded with 404`)
      return { url, contentType: '', body: pages[url] }
    }
    const createClient = (account: Account) =>
      ({
        username: account.username,
        ensureAccount: async () => {
          if (failAccountFor && account.firstName === failAccountFor) throw new Error('API down')
          registered.push(account)
        },
      }) as unknown as SimplefeedClient
    const channels = new FeedChannels({
      api,
      fetchPage,
      registrationKey: 'key',
      createClient,
      start: (client) => {
        started.push(client.username)
      },
      logger: silentLogger,
    })
    return { channels, failed, activated, registered, started }
  }

  it('creates a channel for a new feed and activates it', async () => {
    const { channels, activated, registered } = setup([{ id: 'fee-1', url: 'https://sz.example.com/', status: 'pending' }])

    await channels.activatePending()

    expect(registered).toEqual([expect.objectContaining({ firstName: 'SZ München', bio: 'Nachrichten aus München' })])
    expect(activated['fee-1']).toEqual({
      feedUrl: 'https://sz.example.com/rss',
      title: 'SZ München',
      channelUsername: registered[0].username,
    })
  })

  it('reports feeds it cannot read', async () => {
    const { channels, failed, registered } = setup([{ id: 'fee-1', url: 'https://nofeed.example.com/', status: 'pending' }])

    await channels.activatePending()

    expect(failed).toEqual({ 'fee-1': 'no feed found at https://nofeed.example.com/' })
    expect(registered).toEqual([])
  })

  it("keeps going when one feed's channel can't be created", async () => {
    const { channels, activated } = setup(
      [
        { id: 'fee-1', url: 'https://sz.example.com/', status: 'pending' },
        { id: 'fee-2', url: 'https://other.example.com/feed', status: 'pending' },
      ],
      { failAccountFor: 'SZ München' }
    )

    await channels.activatePending()

    expect(Object.keys(activated)).toEqual(['fee-2'])
  })

  it('starts each active feed once', async () => {
    const active: FeedRequest = {
      id: 'fee-1',
      url: 'https://sz.example.com/',
      feedUrl: 'https://sz.example.com/rss',
      status: 'active',
      channel: { id: 'use-1', username: 'sz-munchen-abc123', firstName: 'SZ München', lastName: '' },
    }
    const { channels, started } = setup([active])

    await channels.startActive()
    await channels.startActive()

    expect(started).toEqual(['sz-munchen-abc123'])
  })
})
