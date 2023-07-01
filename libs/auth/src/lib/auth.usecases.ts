import { Injectable } from '@nestjs/common'
import { User, UsersRepository } from '@simplefeed/user'
import { AuthService } from '@simplefeed/auth'

@Injectable()
export class AuthUsecases {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UsersRepository
  ) {}

  async register(user: User): Promise<User> {
    const hashedPassword = await this.authService.hashPassword(user.password)
    const registeredUser = await this.userRepository.save(
      User.create({
        ...user,
        password: hashedPassword,
      }, user.id)
    )
    return registeredUser
  }

  async login(
    user: User
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return {
      accessToken: this.authService.createAccessToken(user),
      refreshToken: await this.authService.createRefreshToken(user),
    }
  }
}
