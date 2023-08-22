import { Injectable, Logger } from '@nestjs/common'
import { User } from '@simplefeed/user'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { UserSearchDto } from './dto/user-search.dto'
import { UserSearchResultDto } from './dto/user-search-result.dto'

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)
  index = 'users'

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexUser(user: User) {
    this.logger.log(`Indexing user ${JSON.stringify(user, null, 1)}`)
    return await this.elasticsearchService.index<
      UserSearchResultDto,
      UserSearchDto
    >({
      index: this.index,
      body: {
        id: user.id,
        username: user.profile.username,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        imageUrl: user.profile.imageUrl,
      },
    })
  }

  async searchUser(text: string) {
    const { body } =
      await this.elasticsearchService.search<UserSearchResultDto>({
        index: this.index,

        body: {
          query: {
            bool: {
              should: [
                {
                  multi_match: {
                    query: text,
                    fields: ['username', 'firstName', 'lastName'],
                  },
                },
                {
                  bool: {
                    should: [
                      {
                        fuzzy: {
                          firstName: {
                            value: text,
                            fuzziness: 'AUTO',
                          },
                        },
                      },
                      {
                        fuzzy: {
                          lastName: {
                            value: text,
                            fuzziness: 'AUTO',
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      })
    const hits = body.hits.hits
    return hits.map((item) => item._source)
  }
}
