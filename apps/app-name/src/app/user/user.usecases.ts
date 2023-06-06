import { User, UsersRepository } from '@kittgen/user'
import { Injectable, Logger } from '@nestjs/common'
import { GetUserDto } from '../auth/dto/get-user.dto';
import { RequestWithUser } from '../../../../../libs/auth/src';

@Injectable()
export class UserUsecases {
  private logger = new Logger(UserUsecases.name)

  constructor(private readonly userRepository: UsersRepository) {}

  // async followUser(follower: User, followeeUsername: string): Promise<User> {
  //   const followee = await this.userRepository.findOneByUsername(followeeUsername)
  //   follower.follow(followee)
  //   await this.userRepository.update(follower)
  //   return followee
  // }

  // async unfollowUser(follower: User, followeeUsername: string): Promise<User> {
  //   const followee = await this.userRepository.findOneByUsername(followeeUsername)
  //   follower.unfollow(followee)
  //   return await this.userRepository.update(follower)
  // }

  // async getUser(userId: string) {
  //   return this.userRepository.findOneById(userId)
  // }

  async getUserByUserName(username: string): Promise<GetUserDto> {
    const user = await this.userRepository.findOneByUsernameOrFail(username)
    return GetUserDto.fromDomain(user)
  }

  async getFriendsOfUser(username: string): Promise<GetUserDto[]> {
    const user = await this.userRepository.findOneByUsernameOrFail(username);
    const friends = await this.userRepository.findMany(user.friends.map(friend => friend.id));
    return friends.map(friend => GetUserDto.fromDomain(friend));
  }

  getUserFromRequest(request: RequestWithUser): Promise<User> {
    return this.userRepository.findOneByIdWithFriendsOrFail(request.user.id)
  }

  async getMutualFriends(user: User, friendId: string): Promise<string[]> {
    const userWithFriends =
      await this.userRepository.findOneByIdWithFriendsOrFail(user.id)
    const otherUserWithFriends =
      await this.userRepository.findOneByIdWithFriendsOrFail(friendId)
    const mutualFriends = userWithFriends.friends.filter((friend) =>
      otherUserWithFriends.friends.some(
        (otherFriend) => otherFriend.id === friend.id
      )
    )
    return mutualFriends.map((friend) => friend.id)
  }
  // async updateUserInfo(user: User, updateUserDto: UpdateUserDto): Promise<User> {
  //   if (updateUserDto.user.email) {
  //     const hashedPassword = await this.authService.hashPassword(updateUserDto.user.password)
  //     user.updateAuthInfo(updateUserDto.user.email, hashedPassword)
  //   }
  //   user.updateProfile({
  //     username: updateUserDto.user.username,
  //     bio: updateUserDto.user.bio,
  //     image: updateUserDto.user.image
  //   })
  //   return await this.userRepository.update(user)
  // }
}
