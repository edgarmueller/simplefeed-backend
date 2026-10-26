import { User } from '@simplefeed/user'

/** A reader's account, as they see it themselves. */
export class GetUserDto {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  imageUrl?: string

  static fromDomain(user: User): GetUserDto {
    return {
      id: user.id,
      email: user.email,
      username: user.profile.username,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      imageUrl: user.profile.imageUrl ?? undefined,
    }
  }
}
