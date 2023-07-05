import { Injectable } from '@nestjs/common';
import { User } from '@simplefeed/user';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { UserSearchDto } from './dto/user-search.dto';
import { UserSearchResultDto } from './dto/user-search-result.dto';
 
@Injectable()
export class SearchService {
  index = 'users'
 
  constructor(
    private readonly elasticsearchService: ElasticsearchService
  ) {
  }
 
  async indexUser(user: User) {
    return await this.elasticsearchService.index<UserSearchResultDto, UserSearchDto>({
      index: this.index,
      body: {
        id: user.id,
        username: user.profile.username,
				firstName: user.profile.firstName,
				lastName: user.profile.lastName,
        imageUrl: user.profile.imageUrl,
      }
    })
  }
 
  async searchUser(text: string) {
    const { body } = await this.elasticsearchService.search<UserSearchResultDto>({
      index: this.index,
      body: {
        query: {
          multi_match: {
            query: text,
            fields: ['username', 'firstName', 'lastName']
          }
        }
      }
    })
    const hits = body.hits.hits;
    return hits.map((item) => item._source);
  }
}