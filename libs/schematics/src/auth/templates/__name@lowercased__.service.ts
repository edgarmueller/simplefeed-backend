import { User } from '@realworld/user'
import bcrypt from 'bcrypt'
import { UserRepository } from '@realworld/user'
import { InvalidCredentialsError } from './errors/invalid-credentials.error'
import { JwtService } from '@nestjs/jwt'
import { TokenPayload } from './interfaces/token-payload.interface'
import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { RefreshToken } from './refresh-token.entity'
import { Repository } from 'typeorm'
import { AUTH_MODULE_OPTIONS } from './__name@lowercased__.constants'
import { AuthModuleOptions } from './interfaces/__name@lowercased__-options.interface'
import { AuthCookie } from './__name@lowercased__-cookie'

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions
  ) { }

  public async register(user: User): Promise<User> {
    user.password = await bcrypt.hash(user.password, 10)
    const createdUser = await this.userRepo.create(user)
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
    const payload: TokenPayload = { userId: user.id.toString(), username: user.profile.username }
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
    const payload: TokenPayload = { userId: user.id.toString(), username: user.profile.username }
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

  async removeRefreshToken(userId: number) {
    return this.refreshTokenRepository.update(userId, {
      token: null,
    })
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
