import { User } from '@simplefeed/user'

export class GetUserDto {
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
  /** Whether the requesting user subscribes to this channel, when known. */
  subscribed?: boolean

  static fromDomain(user: User, subscribed?: boolean): GetUserDto {
    return new GetUserDto({
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
      subscribed,
    })
  }

  constructor(props: Partial<GetUserDto>) {
    Object.assign(this, props)
  }
}
