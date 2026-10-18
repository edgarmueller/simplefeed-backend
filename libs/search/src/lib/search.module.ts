import { Module } from '@nestjs/common'
import { UserModule } from '@simplefeed/user'
import { SearchService } from './search.service'
import { SearchUsecases } from './search.usecases'

@Module({
  imports: [UserModule],
  providers: [SearchService, SearchUsecases],
  exports: [SearchUsecases],
})
export class SearchModule {}
