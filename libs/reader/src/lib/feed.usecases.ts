import { Injectable } from '@nestjs/common'
import { Page, PageOptions } from '@simplefeed/shared-ddd'
import { Entry } from './entry'
import { FeedFilter, FeedStats, ReaderRepository } from './reader.repository'

/** The reader's feed: what channels picked for them, and what they did with it. */
@Injectable()
export class FeedUsecases {
  constructor(private readonly repository: ReaderRepository) {}

  feed(userId: string, filter: FeedFilter, page: PageOptions): Promise<Page<Entry>> {
    return this.repository.findFeed(userId, filter, page)
  }

  async mark(userId: string, entryId: string, state: { read?: boolean; liked?: boolean; saved?: boolean }): Promise<Entry> {
    const entry = await this.repository.findEntryOrFail(entryId, userId)
    entry.mark(state)
    return this.repository.saveEntry(entry)
  }

  /** Marks the reader's whole feed as read, or one channel's part of it. */
  markAllRead(userId: string, channelId?: string): Promise<number> {
    return this.repository.markAllRead(userId, channelId, new Date())
  }

  /** Per channel: unread entries and when the last one was picked. */
  stats(userId: string): Promise<Record<string, FeedStats>> {
    return this.repository.feedStats(userId)
  }
}
