import bcrypt from 'bcrypt'
import { User, UsersRepository } from '@kittgen/user'
import { JwtService } from '@nestjs/jwt'
import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InvalidCredentialsError } from './errors/invalid-credentials.error'
import { TokenPayload } from './interfaces/token-payload.interface'
import { RefreshToken } from './refresh-token.entity'
import { Repository } from 'typeorm'
import { AUTH_MODULE_OPTIONS } from './auth.constants'
import { AuthModuleOptions } from './interfaces/auth-options.interface'
import { AuthCookie } from './auth-cookie'

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UsersRepository,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions
  ) {}

  public async register(user: User): Promise<User> {
    user.password = await bcrypt.hash(user.password, 10)
    const createdUser = await this.userRepo.save(user)
    return createdUser
  }

  public async hashPassword(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10)
    return hashedPassword
  }

  public async authenticate(
    email: string,
    plainTextPassword: string
  ): Promise<User> {
    try {
      const user = await this.userRepo.findOneByEmail(email)
      await this.verifyPassword(plainTextPassword, user.password)
      return user
    } catch (error) {
      throw new InvalidCredentialsError()
    }
  }

  createAccessToken(user: User) {
    const payload: TokenPayload = {
      userId: user.id.toString(),
      username: user.profile.username,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      imageUrl: user.profile.imageUrl,
    }
    const expiresIn = this.options.accessTokenExpirationInSeconds
    const token = this.jwtService.sign(payload, {
      secret: this.options.accessTokenSecret,
      expiresIn: `${expiresIn}s`,
    })
    return token
  }

  async createAccessTokenCookie(user: User) {
    const accessToken = await this.createAccessToken(user)
    const accessTokenMaxAge = this.options.accessTokenExpirationInSeconds
    const accessTokenCookie = AuthCookie.cookieForAccessToken(
      accessToken,
      accessTokenMaxAge
    )
    return accessTokenCookie
  }

  async createRefreshTokenCookie(user: User) {
    const refreshToken = await this.createRefreshToken(user)
    const refreshTokenMaxAge = this.options.refreshTokenExpirationInSeconds
    const refreshTokenCookie = AuthCookie.cookieForRefreshToken(
      refreshToken,
      refreshTokenMaxAge
    )
    return refreshTokenCookie
  }

  async createRefreshToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      userId: user.id.toString(),
      username: user.profile.username,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      imageUrl: user.profile.imageUrl,
    }
    const expiresIn = this.options.refreshTokenExpirationInSeconds
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.options.refreshTokenSecret,
      expiresIn: `${expiresIn}s`,
    })
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { userId: user.id.toString() },
    })
    if (existingToken) {
      await this.refreshTokenRepository.save({
        id: existingToken.id,
        userId: user.id.toString(),
        token: hashedRefreshToken,
      })
    } else {
      await this.refreshTokenRepository.save({
        userId: user.id.toString(),
        token: hashedRefreshToken,
      })
    }
    return refreshToken
  }

  async verifyRefreshTokenMatches(
    refreshToken: string,
    userId: string
  ): Promise<boolean> {
    const hashedRefreshToken = await this.refreshTokenRepository.findOne({
      where: { userId },
    })
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      hashedRefreshToken.token
    )

    return isRefreshTokenMatching
  }

  async removeRefreshToken(userId: string) {
    return this.refreshTokenRepository.update(userId, {
      token: null,
    })
  }

  async updatePassword(user: User, password: string) {
    await user.updatePassword(password);
    await this.userRepo.save(user)
  }

  async findOneUserByToken(token: string): Promise<User> {
    const payload: TokenPayload = this.jwtService.verify(token);
    if (payload.userId) {
      return this.userRepo.findOneByIdOrFail(payload.userId);
    }
  }

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string
  ) {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword
    )
    if (!isPasswordMatching) {
      throw new InvalidCredentialsError()
    }
  }
}
