import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ReaderModule as ReaderCoreModule } from '@simplefeed/reader'
import { ChannelsController } from './adapters/channels.controller'
import { FeedController } from './adapters/feed.controller'
import { TuningController } from './adapters/tuning.controller'
import { WorkerController } from './adapters/worker.controller'

@Module({
  imports: [ReaderCoreModule, ConfigModule],
  controllers: [ChannelsController, FeedController, TuningController, WorkerController],
})
export class ReaderModule {}
