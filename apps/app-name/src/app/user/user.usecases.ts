import { User, UsersRepository } from '@kittgen/user';
import { Injectable, Logger } from "@nestjs/common"

@Injectable()
export class UserUsecases {
  private logger = new Logger(UserUsecases.name)

  constructor(
    private readonly userRepository: UsersRepository,
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

  async getUserByUserName(username: string): Promise<User> {
    return this.userRepository.findOneByUsernameOrFail(username)
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
