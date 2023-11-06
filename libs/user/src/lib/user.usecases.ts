import { Injectable, Logger } from '@nestjs/common'
import { S3Service } from '@kittgen/s3'
import { UsersRepository } from './user.repository'
import { User } from './user'
@Injectable()
export class UserUsecases {
  private logger = new Logger(UserUsecases.name)

  constructor(
    private readonly userRepository: UsersRepository,
    private s3Service: S3Service
  ) { }

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

  async getUserByUserName(
    requestingUser: User,
    username: string,
  ): Promise<User & { mutualFriends?: string[] }> {
    if (requestingUser.profile.username === username) {
      return await this.getMe(requestingUser)
    }
    const user = await this.userRepository.findOneByUsernameWithFriendsOrFail(
      username
    )
    return user;
    // const mutualFriends = await this.getMutualFriends(requestingUser, user)
    // if (withMutualFriends) {
    //   return {
    //     mutualFriends,
    //   }
    // }
    // return user
  }


  async getFriendsOfUser(username: string): Promise<User[]> {
    const user = await this.userRepository.findOneByUsernameWithFriendsOrFail(
      username
    )
    const friends = await this.userRepository.findMany(
      user.friends.map((friend) => friend.id)
    )
    return friends;
  }

  async getMe(requestingUser: User): Promise<User> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(
      requestingUser.id
    )
    return user;
  }

  async getMutualFriends(user: User, otherUser: User): Promise<string[]> {
    const userWithFriends =
      await this.userRepository.findOneByIdWithFriendsOrFail(user.id)
    const mutualFriends = userWithFriends.friends.filter((friend) =>
      otherUser.friends.some((otherFriend) => otherFriend.id === friend.id)
    )
    return mutualFriends.map((friend) => friend.id)
  }

  async updateUserInfo(
    userId: string,
    email?: string,
    password?: string,
    avatar?: {
      imageBuffer: Buffer,
      filename: string,
    },
    firstName?: string,
    lastName?: string
  ): Promise<User> {
    const user = await this.userRepository.findOneByIdOrFail(userId)
    user.updateEmail(email)
    await user.updatePassword(password)
    user.profile.updateProfile({
      firstName,
      lastName,
    })
    const me = await this.updateAvatar(avatar.imageBuffer, avatar.filename, user)
    await this.userRepository.save(me)
    return me
  }

  async updateAvatar(imageBuffer: Buffer, filename: string, user: User) {
    if (!imageBuffer) {
      return user;
    }
    const uploadResult = await this.s3Service.uploadPublicFile(
      imageBuffer,
      filename
    )
    user.profile.updateAvatar(uploadResult.Location)
  }

  async closeAccount(user: User) {
    user.close()
    await this.userRepository.softDeleteByEmail(user.email)
  }

  async reactivateAccount(email: string) {
    await this.userRepository.restoreByEmail(email)
  }
}
