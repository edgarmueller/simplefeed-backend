import { Injectable, Logger } from '@nestjs/common'
import { S3Service } from '@simplefeed/s3'
import { UsersRepository } from './user.repository'
import { User } from './user'
@Injectable()
export class UserUsecases {
  private logger = new Logger(UserUsecases.name)

  constructor(
    private readonly userRepository: UsersRepository,
    private s3Service: S3Service
  ) { }

  async getUserByUserName(
    requestingUser: User,
    username: string,
  ): Promise<User> {
    if (requestingUser.profile.username === username) {
      return await this.getMe(requestingUser)
    }
    const user = await this.userRepository.findOneByUsernameWithFriendsOrFail(
      username
    )
    return user;
  }

  /** The automated accounts users can subscribe to. */
  getChannels(): Promise<User[]> {
    return this.userRepository.findBots()
  }

  async getMe(requestingUser: User): Promise<User> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(
      requestingUser.id
    )
    return user;
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
    const imageUrl = await this.s3Service.uploadPublicFile(imageBuffer, filename)
    user.profile.updateAvatar(imageUrl)
    return user
  }

  async closeAccount(user: User) {
    user.close()
    await this.userRepository.softDelete(user)
  }

  async reactivateAccount(email: string) {
    await this.userRepository.restoreByEmail(email)
  }
}
