import { ChannelInfo } from '../api/worker-api'
import { FakeWorkerApi } from '../test/fake-api'
import { PageFetcher } from '../sources/safe-fetch'
import { silentLogger } from '../test/fixtures'
import { FeedDiscovery } from './feed-channels'

const RSS = `<rss version="2.0"><channel><title>SZ München</title><description>Nachrichten aus München</description>
  <item><title>Neue U-Bahn-Linie</title><link>https://www.sueddeutsche.de/muenchen/u9</link></item>
</channel></rss>`

const pending = (id: string, url: string): ChannelInfo => ({ id, kind: 'feed', url, status: 'pending' })

function setup(channels: ChannelInfo[]) {
  const api = new FakeWorkerApi()
  api.channelList = channels
  const pages: Record<string, string> = {
    'https://sz.example.com/': '<html><link rel="alternate" type="application/rss+xml" href="/rss"></html>',
    'https://sz.example.com/rss': RSS,
    'https://other.example.com/feed': RSS.replace('SZ München', 'Other News'),
    'https://nofeed.example.com/': '<html></html>',
  }
  const fetchPage: PageFetcher = async (url) => {
    if (!(url in pages)) throw new Error(`${url} responded with 404`)
    return { url, contentType: '', body: pages[url] }
  }
  const started: string[] = []
  const discovery = new FeedDiscovery({
    api: api.asApi(),
    fetchPage,
    onActivated: (channel) => {
      started.push(channel.id)
    },
    logger: silentLogger,
  })
  return { api, discovery, started }
}

describe('FeedDiscovery', () => {
  it('finds the feed behind a website, activates the channel and starts it', async () => {
    const { api, discovery, started } = setup([pending('cha-1', 'https://sz.example.com/')])

    await discovery.activatePending()

    expect(api.activated['cha-1']).toEqual({
      feedUrl: 'https://sz.example.com/rss',
      name: 'SZ München',
      description: 'Nachrichten aus München',
      siteUrl: undefined,
    })
    expect(started).toEqual(['cha-1'])
  })

  it('reports feeds it cannot read', async () => {
    const { api, discovery, started } = setup([pending('cha-1', 'https://nofeed.example.com/')])

    await discovery.activatePending()

    expect(api.failed).toEqual({ 'cha-1': 'no feed found at https://nofeed.example.com/' })
    expect(started).toEqual([])
  })

  it("keeps going when one feed can't be activated", async () => {
    const { api, discovery } = setup([pending('cha-1', 'https://sz.example.com/'), pending('cha-2', 'https://other.example.com/feed')])
    const activate = api.activate.bind(api)
    api.activate = async (id, found) => {
      if (id === 'cha-1') throw new Error('API down')
      return activate(id, found)
    }

    await discovery.activatePending()

    expect(Object.keys(api.activated)).toEqual(['cha-2'])
  })
})
