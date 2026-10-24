import { Injectable } from '@nestjs/common';
import { UsersRepository } from './user.repository';
import { User } from './user';

@Injectable()
export class SubscriptionUsecases {
  constructor(private readonly userRepository: UsersRepository) {}

  /** Subscribes right away; channels don't confirm subscriptions. */
  async subscribe(subscriber: User, channelUsername: string): Promise<User> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(subscriber.id)
    const channel = await this.userRepository.findOneByUsernameWithFriendsOrFail(channelUsername)
    user.subscribeTo(channel)
    await this.userRepository.saveMany([user, channel])
    return channel
  }

  async unsubscribe(subscriber: User, channelUsername: string): Promise<void> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(subscriber.id)
    const channel = await this.userRepository.findOneByUsernameWithFriendsOrFail(channelUsername)
    user.unsubscribeFrom(channel)
    await this.userRepository.saveMany([user, channel])
  }
}
