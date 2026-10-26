import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChannelUsecases } from './channel.usecases'
import { FeedUsecases } from './feed.usecases'
import { ReaderRepository } from './reader.repository'
import { readerSchemas } from './schemas'
import { TuningUsecases } from './tuning.usecases'
import { WorkerUsecases } from './worker.usecases'

const USECASES = [ChannelUsecases, FeedUsecases, TuningUsecases, WorkerUsecases]

@Module({
  imports: [TypeOrmModule.forFeature(readerSchemas)],
  providers: [ReaderRepository, ...USECASES],
  exports: [ReaderRepository, ...USECASES],
})
export class ReaderModule {}
