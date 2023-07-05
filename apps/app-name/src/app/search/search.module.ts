import { Module } from '@nestjs/common'
import { SearchModule as SearchCoreModule } from '@simplefeed/search'
import { SearchController } from './search.controller'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  controllers: [SearchController],
  imports: [
    SearchCoreModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('search.enabled'),
        node: configService.get('search.node'),
        username: configService.get('search.username'),
        password: configService.get('search.password'),
      }),
    }),
  ],
})
export class SearchModule {}
