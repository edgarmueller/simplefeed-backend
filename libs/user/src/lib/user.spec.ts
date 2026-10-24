import { NotAChannelError } from './errors/not-a-channel.error'
import { SubscribedToChannel } from './events/subscribed-to-channel.event'
import { Profile } from './profile'
import { User } from './user'

const user = (username: string, isBot = false) =>
  User.create({
    email: `${username}@example.com`,
    password: 'secret',
    profile: Profile.create({ username, isBot }),
  })

describe('User', () => {
  it('should subscribe to a channel right away', () => {
    const fry = user('fry')
    const channel = user('hackernews', true)

    fry.subscribeTo(channel)

    expect(fry.isFriend(channel)).toBe(true)
    expect(channel.isFriend(fry)).toBe(true)
    expect(fry.getUncommittedEvents().filter((event) => event instanceof SubscribedToChannel)).toHaveLength(1)
  })

  it('should subscribe only once', () => {
    const fry = user('fry')
    const channel = user('hackernews', true)

    fry.subscribeTo(channel)
    fry.subscribeTo(channel)

    expect(fry.friends).toHaveLength(1)
    expect(fry.getUncommittedEvents().filter((event) => event instanceof SubscribedToChannel)).toHaveLength(1)
  })

  it('should not subscribe to regular users', () => {
    expect(() => user('fry').subscribeTo(user('lisa'))).toThrow(NotAChannelError)
  })

  it('should unsubscribe', () => {
    const fry = user('fry')
    const channel = user('hackernews', true)
    fry.subscribeTo(channel)

    fry.unsubscribeFrom(channel)

    expect(fry.isFriend(channel)).toBe(false)
    expect(channel.isFriend(fry)).toBe(false)
  })
})
