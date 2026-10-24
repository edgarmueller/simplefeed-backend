import { User } from '@simplefeed/user'
import { GetUserDto } from './get-user.dto'

export class GetMeDto {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  bio?: string
  imageUrl?: string
  isBot?: boolean
  nrOfLikes?: number
  nrOfPosts?: number
  /** The channels this user subscribes to. */
  subscriptions: GetUserDto[]

  static fromDomain(user: User): GetMeDto {
    return new GetMeDto({
      id: user.id,
      email: user.email,
      username: user.profile.username,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      bio: user.profile.bio,
      imageUrl: user.profile.imageUrl,
      isBot: user.profile.isBot,
      nrOfLikes: user.profile.nrOfLikes,
      nrOfPosts: user.profile.nrOfPosts,
      subscriptions: user.friends?.map((channel) => GetUserDto.fromDomain(channel, true)) ?? [],
    })
  }

  constructor(props: Partial<GetMeDto>) {
    Object.assign(this, props)
  }
}
