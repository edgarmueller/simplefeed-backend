import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from '@simplefeed/user'
import { FeedRepository } from './feed.repository'
import { FeedSchema } from './feed.schema'
import { FeedUsecases } from './feed.usecases'

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([FeedSchema]), CqrsModule],
  providers: [FeedRepository, FeedUsecases],
  exports: [FeedRepository, FeedUsecases],
})
export class FeedModule {}
