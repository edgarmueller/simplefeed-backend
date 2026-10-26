import { Profile, User } from '@simplefeed/user'
import { FeedActivated } from './events/feed-activated.event'
import { Feed, normalizeFeedUrl } from './feed'
import { InvalidFeedUrlError } from './errors/invalid-feed-url.error'

const user = (username: string, isBot = false) =>
  User.create({ email: `${username}@example.com`, password: 'secret', profile: Profile.create({ username, isBot }) })

describe('normalizeFeedUrl', () => {
  it('adds a missing scheme and drops fragments', () => {
    expect(normalizeFeedUrl(' sz.de/muenchen ')).toBe('https://sz.de/muenchen')
    expect(normalizeFeedUrl('http://example.com/feed.xml#top')).toBe('http://example.com/feed.xml')
    expect(normalizeFeedUrl('localhost:5098/feed')).toBe('https://localhost:5098/feed')
  })

  it.each(['', 'not a url', 'ftp://example.com/feed', 'javascript:alert(1)', 'intranet'])(
    'rejects %j',
    (input) => {
      expect(() => normalizeFeedUrl(input)).toThrow(InvalidFeedUrlError)
    }
  )
})

describe('Feed', () => {
  it('subscribes everyone who asked for it once activated', () => {
    const bart = user('bart')
    const lisa = user('lisa')
    const feed = Feed.request('example.com', bart)
    feed.requestAgain(lisa)
    feed.requestAgain(lisa)

    feed.activate(user('example', true), 'https://example.com/feed.xml', 'Example')

    const [event] = feed.getUncommittedEvents() as FeedActivated[]
    expect(event).toBeInstanceOf(FeedActivated)
    expect(event.subscribers).toEqual([bart, lisa])
    expect(feed).toMatchObject({ status: 'active', title: 'Example', requesters: [] })
  })

  it('only activates with a channel', () => {
    expect(() => Feed.request('example.com', user('bart')).activate(user('lisa'), 'https://example.com', 'x')).toThrow()
  })

  it('tries a failed feed again when someone adds it again', () => {
    const feed = Feed.request('example.com', user('bart'))
    feed.fail('no feed found')
    expect(feed).toMatchObject({ status: 'failed', error: 'no feed found' })

    feed.requestAgain(user('lisa'))

    expect(feed).toMatchObject({ status: 'pending', error: null })
  })
})
