import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd'
import { UserCreatedEvent } from './events/user-created.event'
import { FriendRequest } from './friend-request'
import { Profile } from './profile'

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
  incomingFriendRequests?: FriendRequest[]
  outgoingFriendRequests?: FriendRequest[]

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
    //if (this.isFriend(otherUser) || this.hasSentFriendRequestTo(otherUser)) {
    //  throw new Error("already friends or request has been sent");
    //}
    const friendRequest = FriendRequest.create({ from: this, to: otherUser })
    this.outgoingFriendRequests = [...this.sentFriendRequests, friendRequest]
    otherUser.incomingFriendRequests = [
      ...otherUser.receivedFriendRequests,
      friendRequest,
    ]
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

  get sentFriendRequests() {
    if (!this.outgoingFriendRequests) {
      this.outgoingFriendRequests = []
    }
    return this.outgoingFriendRequests
  }

  get receivedFriendRequests() {
    if (!this.incomingFriendRequests) {
      this.incomingFriendRequests = []
    }
    return this.incomingFriendRequests
  }
}
