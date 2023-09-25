import { Profile } from './profile'
import { User } from './user'

describe('User', () => {
  it('should allow sending a friend request', () => {
    const fry = User.create({
      email: 'fry@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'fry' }),
    })
    const lisa = User.create({
      email: 'lisa@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'lisa' }),
    })
    fry.sendFriendRequestTo(lisa)
    expect(fry.friendRequests).toHaveLength(1)
  })

  it('should allow confirming a friend request', () => {
    const fry = User.create({
      email: 'fry@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'fry' }),
    })
    const lisa = User.create({
      email: 'lisa@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'lisa' }),
    })
    const friendRequest= fry.sendFriendRequestTo(lisa)
    friendRequest.accept()
    expect(fry.friendRequests).toHaveLength(0)
    expect(fry.friends).toHaveLength(1)
  });

  it('should allow cancelling a friend request', () => {
    const fry = User.create({
      email: 'fry@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'fry' }),
    })
    const lisa = User.create({
      email: 'lisa@example.com',
      password: 'secret',
      profile: Profile.create({ username: 'lisa' }),
    })
    const friendRequest = fry.sendFriendRequestTo(lisa)
    friendRequest.cancel()
    expect(fry.friendRequests).toHaveLength(0)
    expect(fry.friends).toBeUndefined();
  });
})
