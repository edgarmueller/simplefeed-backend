import { Injectable } from '@nestjs/common'
import { UsersRepository } from '@simplefeed/user'
import { UserSearchDto } from './dto/user-search.dto'

const MAX_RESULTS = 20

@Injectable()
export class SearchService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async searchUser(text: string): Promise<UserSearchDto[]> {
    const term = text?.trim()
    if (!term) {
      return []
    }
    const users = await this.usersRepository.searchByName(term, MAX_RESULTS)
    return users.map((user) => ({
      id: user.id,
      username: user.profile.username,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      imageUrl: user.profile.imageUrl,
    }))
  }
}
