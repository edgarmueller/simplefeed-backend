// import { ConversationRepository } from '@kittgen/chat'
import { Injectable, Logger } from '@nestjs/common'
import { S3Service } from '@kittgen/s3'
import { UsersRepository } from './user.repository'
import { User } from './user'
import { Profile } from './profile'
import { GetMeDto } from './dto/get-me.dto'
import { GetUserDto } from './dto/get-user.dto'

@Injectable()
export class UserUsecases {
  private logger = new Logger(UserUsecases.name)

  constructor(
    private readonly userRepository: UsersRepository,
    // private readonly conversationRepository: ConversationRepository,
    private s3Service: S3Service
  ) {}

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
    username: string
  ): Promise<GetMeDto | GetUserDto> {
    if (requestingUser.profile.username === username) {
      return await this.getMe(requestingUser)
    }
    const user = await this.userRepository.findOneByUsernameWithFriendsOrFail(
      username
    )
    const mutualFriends = await this.getMutualFriends(requestingUser, user)
    return GetUserDto.fromDomain(user).withMutualFriends(mutualFriends.length)
  }

  async getFriendsOfUser(username: string): Promise<GetUserDto[]> {
    const user = await this.userRepository.findOneByUsernameWithFriendsOrFail(
      username
    )
    const friends = await this.userRepository.findMany(
      user.friends.map((friend) => friend.id)
    )
    return friends.map((friend) => GetUserDto.fromDomain(friend))
  }

  async getMe(requestingUser: User): Promise<GetMeDto> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(
      requestingUser.id
    )
    // const conversations = await this.conversationRepository.findByUserId(user.id)
    return GetMeDto.fromDomain(user)//.withConversations(conversations)
  }

  async getMutualFriends(user: User, otherUser: User): Promise<string[]> {
    const userWithFriends =
      await this.userRepository.findOneByIdWithFriendsOrFail(user.id)
    const mutualFriends = userWithFriends.friends.filter((friend) =>
      otherUser.friends.some((otherFriend) => otherFriend.id === friend.id)
    )
    return mutualFriends.map((friend) => friend.id)
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
    return await this.userRepository.save(user)
  }

  async updateUserInfo(
    user: User,
    email?: string,
    password?: string,
    imageBuffer?: Buffer,
    filename?: string,
    updatedProfile?: Pick<Profile, 'firstName' | 'lastName'>
  ): Promise<GetMeDto> {
    user.updateEmail(email)
    await user.updatePassword(password)
    user.profile.updateProfile(updatedProfile)
    const me = await this.updateAvatar(imageBuffer, filename, user)
    return GetMeDto.fromDomain(me);
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
