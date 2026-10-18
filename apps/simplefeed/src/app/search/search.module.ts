import { Module } from '@nestjs/common'
import { SearchModule as SearchCoreModule } from '@simplefeed/search'
import { SearchController } from './adapters/search.controller'

@Module({
  controllers: [SearchController],
  imports: [SearchCoreModule],
})
export class SearchModule {}
