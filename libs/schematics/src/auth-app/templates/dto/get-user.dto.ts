import { User } from '@kittgen/user'

export class GetUserDto {
  email: string
  token?: string
  refreshToken?: string
  username: string
  bio?: string
  image?: string

  static fromDomain(user: User): GetUserDto {
    return new GetUserDto({
      email: user.email,
      username: user.profile.username,
      bio: user.profile.bio,
      image: user.profile.image,
    })
  }

  constructor(props: Partial<GetUserDto>) {
    Object.assign(this, props)
  }

  withToken(token: string) {
    this.token = token
    return this
  }

  withRefreshToken(token: string) {
    this.refreshToken = token
    return this
  }
}
