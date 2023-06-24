import { User } from '@kittgen/user'
import { GetUserDto } from './get-user.dto'
import { GetConversationDto } from '../../chat/dto/get-conversation.dto'
import { Conversation } from '@kittgen/chat'

export class GetMeDto {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  bio?: string
  imageUrl?: string
  nrOfLikes?: number
  nrOfPosts?: number
  friends: GetUserDto[]
  conversations: GetConversationDto[]

  static fromDomain(user: User): GetMeDto {
    return new GetMeDto({
      id: user.id,
      email: user.email,
      username: user.profile.username,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      bio: user.profile.bio,
      imageUrl: user.profile.imageUrl,
      nrOfLikes: user.profile.nrOfLikes,
      nrOfPosts: user.profile.nrOfPosts,
      friends: user.friends?.map((friend) => GetUserDto.fromDomain(friend)),
    })
  }

  constructor(props: Partial<GetUserDto>) {
    Object.assign(this, props)
  }

  withConversations(conversations: Conversation[]): GetMeDto {
    this.conversations = conversations.map(GetConversationDto.fromDomain)
    return this;
  }
}
