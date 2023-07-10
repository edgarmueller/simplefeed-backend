import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd'
import bcrypt from 'bcrypt'
import { UserCreatedEvent } from './events/user-created.event'
import { FriendRequest } from './friend-request'
import { Profile } from './profile'
import { FriendRequestSent } from './events/friend-request-sent.event'

const PREFIX = 'use'
export type UserId = string
const createUserId = createId(PREFIX)

export class User extends AggregateRoot {
  email?: string
  password?: string
  createdAt?: Date
  updatedAt?: Date

  profile: Profile
  friends?: User[]
  friendRequests?: FriendRequest[]

  public static create(
    props: Omit<
      Props<User>,
      'sentFriendRequests' | 'receivedFriendRequests' | 'friends'
    >,
    id?: string
  ): User {
    const isNewUser = !!id === false
    const user = new User({ ...props }, id)

    if (isNewUser) {
      user.emitDomainEvent(new UserCreatedEvent(user))
    }

    return user
  }

  private constructor(
    props: Omit<
      Props<User>,
      'sentFriendRequests' | 'receivedFriendRequests' | 'friends'
    >,
    id?: string
  ) {
    super(props, id || createUserId())
  }

  sendFriendRequestTo(otherUser: User): FriendRequest {
    const friendRequest = FriendRequest.create({ from: this, to: otherUser })
    if (!this.friendRequests) {
      this.friendRequests = []
    }
    this.friendRequests.push(friendRequest);
    this.emitDomainEvent(new FriendRequestSent(friendRequest))
    return friendRequest
  }

  isFriend(user: User) {
    return this.friends?.find((friend) => friend.id === user.id) !== undefined
  }

  addFriend(user: User) {
    if (!this.friends) {
      this.friends = []
    }
    this.friends.push(user)
    if (!user.friends) {
      user.friends = []
    }
    user.friends?.push(this)
  }

  unfriend(friend: User) {
    this.friends = this.friends?.filter((f) => f.id !== friend.id)
    friend.friends = friend.friends?.filter((f) => f.id !== this.id)
  }

  updateEmail(email: string) {
    if (email) {
      this.email = email;
    }
  }

  async updatePassword(password: string) {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      this.password = hashedPassword;
    }
  }
}
