import { Injectable } from '@nestjs/common'
import { User, UsersRepository } from '@kittgen/user'
import { AuthService } from '@kittgen/auth'

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
      })
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
