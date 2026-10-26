import { FetchedPage, PageFetcher } from './safe-fetch'
import { FeedSource, discoverFeed, feedLinks, parseFeed, plainText } from './rss'

const NOW = new Date('2026-10-26T12:00:00Z')

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>SZ München</title>
    <link>https://www.sueddeutsche.de/muenchen</link>
    <description>Nachrichten aus München</description>
    <item>
      <title>Neue U-Bahn-Linie &amp; mehr</title>
      <link>https://www.sueddeutsche.de/muenchen/u9-1.123</link>
      <guid isPermaLink="false">sz-123</guid>
      <pubDate>Sun, 26 Oct 2026 09:30:00 +0100</pubDate>
      <description><![CDATA[<p>Die <b>U9</b> soll 2035 fahren.</p>]]></description>
    </item>
    <item>
      <title>Oktoberfest-Bilanz</title>
      <link>https://www.sueddeutsche.de/muenchen/wiesn-1.456</link>
    </item>
    <item>
      <title>No link, skipped</title>
    </item>
  </channel>
</rss>`

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">Mit Vergnügen München</title>
  <link rel="self" href="https://muenchen.example.com/feed.atom"/>
  <link rel="alternate" href="https://muenchen.example.com/"/>
  <entry>
    <title>10 Biergärten für den Herbst</title>
    <link rel="alternate" href="https://muenchen.example.com/biergaerten"/>
    <id>tag:example.com,2026:1</id>
    <updated>2026-10-25T08:00:00Z</updated>
    <summary type="html">&lt;p&gt;Noch ist es warm genug.&lt;/p&gt;</summary>
  </entry>
</feed>`

describe('parseFeed', () => {
  it('reads RSS items, skipping ones without a link', () => {
    const feed = parseFeed(RSS, NOW)

    expect(feed.title).toBe('SZ München')
    expect(feed.items).toEqual([
      {
        id: 'sz-123',
        title: 'Neue U-Bahn-Linie & mehr',
        url: 'https://www.sueddeutsche.de/muenchen/u9-1.123',
        domain: 'sueddeutsche.de',
        postedAt: new Date('2026-10-26T08:30:00Z'),
        excerpt: 'Die U9 soll 2035 fahren.',
        sourceName: 'SZ München',
      },
      // undated items count as new when first seen
      expect.objectContaining({ id: 'https://www.sueddeutsche.de/muenchen/wiesn-1.456', postedAt: NOW }),
    ])
  })

  it('reads Atom entries', () => {
    const feed = parseFeed(ATOM, NOW)

    expect(feed).toMatchObject({ title: 'Mit Vergnügen München', siteUrl: 'https://muenchen.example.com/' })
    expect(feed.items).toEqual([
      expect.objectContaining({
        id: 'tag:example.com,2026:1',
        title: '10 Biergärten für den Herbst',
        url: 'https://muenchen.example.com/biergaerten',
        excerpt: 'Noch ist es warm genug.',
      }),
    ])
  })

  it('rejects what is not a feed', () => {
    expect(() => parseFeed('<html><body>Hi</body></html>')).toThrow('not a feed')
  })

  it('keeps only the words of HTML', () => {
    expect(plainText('<p>A&nbsp;<a href="x">link</a></p><script>alert(1)</script>')).toBe('A link')
  })
})

describe('feed discovery', () => {
  const pages: Record<string, string> = {
    'https://muenchen.example.com/': `<html><head>
      <link rel="alternate" type="application/atom+xml" title="Feed" href="/feed.atom">
    </head></html>`,
    'https://muenchen.example.com/feed.atom': ATOM,
    'https://blog.example.com/': '<html><head><title>No links</title></head></html>',
    'https://blog.example.com/feed': RSS,
    'https://empty.example.com/': '<html></html>',
  }
  const fetchPage: PageFetcher = async (url): Promise<FetchedPage> => {
    if (!(url in pages)) throw new Error(`${url} responded with 404`)
    return { url, contentType: 'text/html', body: pages[url] }
  }

  it('finds the feed a page links to', async () => {
    const found = await discoverFeed('https://muenchen.example.com/', fetchPage)

    expect(found.feedUrl).toBe('https://muenchen.example.com/feed.atom')
    expect(found.feed.title).toBe('Mit Vergnügen München')
  })

  it('accepts the feed itself', async () => {
    expect((await discoverFeed('https://blog.example.com/feed', fetchPage)).feedUrl).toBe('https://blog.example.com/feed')
  })

  it('tries common feed paths when a page links none', async () => {
    expect((await discoverFeed('https://blog.example.com/', fetchPage)).feedUrl).toBe('https://blog.example.com/feed')
  })

  it('says so when there is no feed', async () => {
    await expect(discoverFeed('https://empty.example.com/', fetchPage)).rejects.toThrow(
      'no feed found at https://empty.example.com/'
    )
  })

  it('gives up on a site that takes too long', async () => {
    let clock = 0
    const slow: PageFetcher = async (url) => {
      clock += 20_000
      if (url === 'https://slow.example.com/') return { url, contentType: 'text/html', body: '<html></html>' }
      throw new Error(`${url} responded with 404`)
    }

    await expect(
      discoverFeed('https://slow.example.com/', slow, { deadlineMs: 30_000, now: () => clock })
    ).rejects.toThrow("no feed found at https://slow.example.com/ in time; try the feed's own address")
  })

  it('resolves relative feed links', () => {
    expect(
      feedLinks('<link href="rss?x=1&amp;y=2" type="application/rss+xml" rel="alternate">', 'https://a.example.com/b/')
    ).toEqual(['https://a.example.com/b/rss?x=1&y=2'])
  })
})

describe('FeedSource', () => {
  it('lists the newest items first', async () => {
    const source = new FeedSource('https://sz.example.com/rss', async (url) => ({ url, contentType: 'application/rss+xml', body: RSS }), () => NOW)

    const items = await source.latest(10)

    expect(items.map((item) => item.title)).toEqual(['Oktoberfest-Bilanz', 'Neue U-Bahn-Linie & mehr'])
  })
})
