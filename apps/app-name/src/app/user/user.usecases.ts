import { User, UsersRepository } from '@kittgen/user'
import { Injectable, Logger } from '@nestjs/common'
import { GetUserDto } from '../auth/dto/get-user.dto';
import { RequestWithUser } from '../../../../../libs/auth/src';
import { GetMeDto } from '../auth/dto/get-me.dto';

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

  async getUserByUserName(requestingUser: User, username: string): Promise<GetMeDto | GetUserDto> {
    if (requestingUser.profile.username === username) {
      return this.getMe(requestingUser);
    }
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(username)
    const mutualFriends = await this.getMutualFriends(requestingUser, user);
    return GetUserDto.fromDomain(user).withMutualFriends(mutualFriends.length);
  }

  async getFriendsOfUser(username: string): Promise<GetUserDto[]> {
    const user = await this.userRepository.findOneByUsernameOrFail(username);
    const friends = await this.userRepository.findMany(user.friends.map(friend => friend.id));
    return friends.map(friend => GetUserDto.fromDomain(friend));
  }

  async getMe(requestingUser: User): Promise<GetMeDto> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(requestingUser.id);
    return GetMeDto.fromDomain(user);
  }

  async getMutualFriends(user: User, otherUser: User): Promise<string[]> {
    const userWithFriends =
      await this.userRepository.findOneByIdWithFriendsOrFail(user.id)
    const mutualFriends = userWithFriends.friends.filter((friend) =>
      otherUser.friends.some(
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
