import { AggregateRoot, Props, createId } from '@simplefeed/shared-ddd';
import bcrypt from 'bcrypt';
import { SubscribedToChannel } from './events/subscribed-to-channel.event';
import { UserCreatedEvent } from './events/user-created.event';
import { Profile } from './profile';
import { UserClosedEvent } from './events/user-closed.event';
import { UserReactivatedEvent } from './events/user-reactivated.event';
import { NotAChannelError } from './errors/not-a-channel.error';

const PREFIX = 'use'
export type UserId = string
const createUserId = createId(PREFIX)

export class User extends AggregateRoot {
  email?: string
  password?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date

  profile: Profile
  /**
   * Subscriptions, stored both ways: a user's are the channels they
   * subscribed to, a channel's are its subscribers.
   */
  friends?: User[]
  closed?: boolean;

  public static create(
    props: Omit<
      Props<User>,
      'friends'
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
      'friends'
    >,
    id?: string
  ) {
    super(props, id || createUserId())
  }

  /** Puts the channel's posts into this user's feed and opens a chat with it. */
  subscribeTo(channel: User) {
    if (!channel.profile.isBot) {
      throw new NotAChannelError(channel.profile.username)
    }
    if (this.isFriend(channel)) {
      return
    }
    this.addFriend(channel)
    this.emitDomainEvent(new SubscribedToChannel(this, channel))
  }

  unsubscribeFrom(channel: User) {
    this.unfriend(channel)
  }

  isFriend(user: User) {
    return this.friends?.find((friend) => friend.id === user.id) !== undefined
  }

  private addFriend(user: User) {
    if (!this.friends) {
      this.friends = []
    }
    this.friends.push(user)
    if (!user.friends) {
      user.friends = []
    }
    user.friends?.push(this)
  }

  private unfriend(friend: User) {
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

  close() {
    this.closed = true;
    this.emitDomainEvent(new UserClosedEvent(this))
  }

  restore() {
    this.emitDomainEvent(new UserReactivatedEvent(this))
  }
}
