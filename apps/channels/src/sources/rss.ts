import { XMLParser } from 'fast-xml-parser'
import { PageFetcher } from './safe-fetch'
import { Source, Story, hostname } from './story'

export interface ParsedFeed {
  title: string
  description?: string
  /** the website the feed belongs to */
  siteUrl?: string
  items: Story[]
}

const MAX_EXCERPT_LENGTH = 400

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // keeps entity-heavy feeds from expanding into huge strings
  processEntities: true,
  htmlEntities: true,
})

type Node = unknown

const list = (value: Node): Node[] => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value])

/** The text of a node that may be a string, a number or an element with attributes. */
function text(value: Node): string {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return text(value[0])
  }
  if (typeof value === 'object' && '#text' in value) {
    return text((value as Record<string, Node>)['#text'])
  }
  return ''
}

/** Feed texts often carry HTML; keep the words. */
export function plainText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const excerpt = (html: string) => {
  const plain = plainText(html)
  return plain.length > MAX_EXCERPT_LENGTH ? `${plain.slice(0, MAX_EXCERPT_LENGTH - 1)}…` : plain || undefined
}

function date(value: Node): Date | undefined {
  const parsed = new Date(text(value))
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function story(fields: { id: string; title: string; link: string; date?: Date; description: string }, feedTitle: string, now: Date): Story | undefined {
  const url = fields.link.trim()
  const domain = hostname(url)
  const title = plainText(fields.title)
  if (!domain || !title || !/^https?:/.test(url)) {
    return undefined
  }
  return {
    id: fields.id.trim() || url,
    title,
    url,
    domain,
    // undated items count as new when first seen; posting each only once keeps them from repeating
    postedAt: fields.date ?? now,
    excerpt: excerpt(fields.description),
    sourceName: feedTitle || undefined,
  }
}

/** Reads RSS 2.0, RSS 1.0 (RDF) and Atom. Throws if `xml` is none of them. */
export function parseFeed(xml: string, now = new Date()): ParsedFeed {
  let document: Record<string, Node>
  try {
    document = parser.parse(xml) as Record<string, Node>
  } catch {
    throw new Error('not a feed')
  }
  const rss = (document.rss as Record<string, Node> | undefined)?.channel as Record<string, Node> | undefined
  const rdf = document['rdf:RDF'] as Record<string, Node> | undefined
  if (rss || rdf) {
    const channel = (rss ?? (rdf?.channel as Record<string, Node>) ?? {}) as Record<string, Node>
    const title = plainText(text(channel.title))
    const items = list(rss ? channel.item : rdf?.item).flatMap((node) => {
      const item = node as Record<string, Node>
      const link = text(item.link)
      return (
        story(
          {
            id: text(item.guid) || link,
            title: text(item.title),
            link,
            date: date(item.pubDate) ?? date(item['dc:date']),
            description: text(item.description) || text(item['content:encoded']),
          },
          title,
          now
        ) ?? []
      )
    })
    return { title, description: plainText(text(channel.description)) || undefined, siteUrl: text(channel.link) || undefined, items }
  }
  const atom = document.feed as Record<string, Node> | undefined
  if (atom) {
    const title = plainText(text(atom.title))
    const alternate = (links: Node) => {
      const all = list(links).map((link) => link as Record<string, string>)
      const href = (all.find((link) => !link['@_rel'] || link['@_rel'] === 'alternate') ?? all[0])?.['@_href']
      return href ?? ''
    }
    const items = list(atom.entry).flatMap((node) => {
      const entry = node as Record<string, Node>
      const link = alternate(entry.link)
      return (
        story(
          {
            id: text(entry.id) || link,
            title: text(entry.title),
            link,
            date: date(entry.published) ?? date(entry.updated),
            description: text(entry.summary) || text(entry.content),
          },
          title,
          now
        ) ?? []
      )
    })
    return { title, description: plainText(text(atom.subtitle)) || undefined, siteUrl: alternate(atom.link) || undefined, items }
  }
  throw new Error('not a feed')
}

const looksLikeFeed = (body: string) => /<(rss|feed|rdf:RDF)[\s>]/i.test(body.slice(0, 2000))

/** The feeds a web page links to with `<link rel="alternate" type="application/rss+xml" href="…">`. */
export function feedLinks(html: string, pageUrl: string): string[] {
  const links: string[] = []
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attribute = (name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]
    const type = attribute('type')?.toLowerCase()
    const rel = attribute('rel')?.toLowerCase().split(/\s+/) ?? []
    const href = attribute('href')
    if (href && rel.includes('alternate') && (type === 'application/rss+xml' || type === 'application/atom+xml')) {
      try {
        links.push(new URL(href.replace(/&amp;/g, '&'), pageUrl).toString())
      } catch {
        // ignore malformed links
      }
    }
  }
  return [...new Set(links)]
}

/** Common places for a site's feed, tried when its pages don't link one. */
const COMMON_FEED_PATHS = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/index.xml']

export interface DiscoveredFeed {
  feedUrl: string
  feed: ParsedFeed
}

/** how long finding a site's feed may take in all, as it can mean several requests */
const DISCOVERY_DEADLINE_MS = 30_000

/** Finds the feed at `url`, which may be the feed itself or a website that has one. */
export async function discoverFeed(
  url: string,
  fetchPage: PageFetcher,
  { deadlineMs = DISCOVERY_DEADLINE_MS, now = () => Date.now() } = {}
): Promise<DiscoveredFeed> {
  const deadline = now() + deadlineMs
  const page = await fetchPage(url)
  if (looksLikeFeed(page.body)) {
    return { feedUrl: page.url, feed: parseFeed(page.body) }
  }
  const origin = new URL(page.url).origin
  const candidates = [...feedLinks(page.body, page.url), ...COMMON_FEED_PATHS.map((path) => origin + path)]
  for (const candidate of candidates) {
    if (now() >= deadline) {
      throw new Error(`no feed found at ${url} in time; try the feed's own address`)
    }
    try {
      const response = await fetchPage(candidate)
      if (looksLikeFeed(response.body)) {
        return { feedUrl: response.url, feed: parseFeed(response.body) }
      }
    } catch {
      // try the next one
    }
  }
  throw new Error(`no feed found at ${url}`)
}

/** The items of one RSS or Atom feed. */
export class FeedSource implements Source {
  constructor(
    private readonly feedUrl: string,
    private readonly fetchPage: PageFetcher,
    private readonly now: () => Date = () => new Date()
  ) {}

  async latest(limit: number): Promise<Story[]> {
    const page = await this.fetchPage(this.feedUrl)
    const { items } = parseFeed(page.body, this.now())
    return items.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime()).slice(0, limit)
  }
}
