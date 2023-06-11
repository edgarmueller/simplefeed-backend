import { UsersRepository } from '@kittgen/user'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class FriendUsecases {
  private logger = new Logger(FriendUsecases.name)

  constructor(private readonly userRepository: UsersRepository) {}

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(userId)
    const friend = await this.userRepository.findOneByIdWithFriendsOrFail(
      friendId
    )
    user.unfriend(friend)
    await this.userRepository.saveMany([user, friend])
  }
}
