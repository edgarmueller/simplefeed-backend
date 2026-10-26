import { Channel, normalizeFeedUrl } from './channel'
import { Entry } from './entry'
import { InvalidFeedUrlError } from './errors/invalid-feed-url.error'
import { DEFAULT_PREFERENCES, normalizePreferences } from './preferences'
import { Subscription } from './subscription'

describe('normalizeFeedUrl', () => {
  it('adds a missing scheme and drops fragments', () => {
    expect(normalizeFeedUrl(' sz.de/muenchen ')).toBe('https://sz.de/muenchen')
    expect(normalizeFeedUrl('http://example.com/feed.xml#top')).toBe('http://example.com/feed.xml')
    expect(normalizeFeedUrl('localhost:5098/feed')).toBe('https://localhost:5098/feed')
  })

  it.each(['', 'not a url', 'ftp://example.com/feed', 'javascript:alert(1)', 'intranet'])('rejects %j', (input) => {
    expect(() => normalizeFeedUrl(input)).toThrow(InvalidFeedUrlError)
  })
})

describe('Channel', () => {
  it('starts a feed as pending and retries it after failing', () => {
    const channel = Channel.feed('example.com/blog')
    expect(channel).toMatchObject({ kind: 'feed', status: 'pending', url: 'https://example.com/blog' })

    channel.fail('no feed found')
    expect(channel).toMatchObject({ status: 'failed', error: 'no feed found' })

    channel.retry()
    expect(channel).toMatchObject({ status: 'pending', error: null })

    channel.activate({ feedUrl: 'https://example.com/feed', name: 'Example' })
    expect(channel).toMatchObject({ status: 'active', name: 'Example', feedUrl: 'https://example.com/feed' })
  })
})

describe('preferences', () => {
  it('cleans untrusted input and keeps the rest of the current preferences', () => {
    const current = { ...DEFAULT_PREFERENCES, interests: ['rust'] }

    expect(normalizePreferences({ muted: [' Crypto ', 'crypto', 42], maxPostsPerDay: 500 }, current)).toEqual({
      ...current,
      muted: ['crypto'],
      maxPostsPerDay: 50,
    })
    // a muted topic is no interest
    expect(normalizePreferences({ interests: ['rust'], muted: ['rust'] }).interests).toEqual([])
  })

  it('tunes a subscription within limits', () => {
    const subscription = Subscription.create({ userId: 'use-1', channel: Channel.feed('example.com') })

    subscription.tune({ minScore: -5, notes: '  no paywalls  ' })

    expect(subscription.preferences).toMatchObject({ minScore: 0, notes: 'no paywalls', maxPostsPerDay: 10 })
  })
})

describe('Entry', () => {
  it('keeps the first time it was read, liked or saved, and can be undone', () => {
    const entry = Entry.create({ userId: 'use-1', subscription: undefined, item: undefined, pickedAt: new Date() })
    const first = new Date('2026-10-26T10:00:00Z')

    entry.mark({ read: true, liked: true }, first)
    entry.mark({ read: true }, new Date('2026-10-26T11:00:00Z'))

    expect(entry).toMatchObject({ readAt: first, likedAt: first })

    entry.mark({ read: false, liked: false, saved: true }, first)
    expect(entry).toMatchObject({ readAt: null, likedAt: null, savedAt: first })
  })
})
