import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FeedModule as FeedCoreModule } from '@simplefeed/feed'
import { UserModule as UserCoreModule } from '@simplefeed/user'
import { FeedActivatedEventHandler } from './adapters/feed-activated.event-handler'
import { FeedsController } from './adapters/feeds.controller'
import { WorkerFeedsController } from './adapters/worker-feeds.controller'

@Module({
  imports: [FeedCoreModule, UserCoreModule, ConfigModule],
  controllers: [FeedsController, WorkerFeedsController],
  providers: [FeedActivatedEventHandler],
})
export class FeedsModule {}
