import { IDomainEvent } from '@simplefeed/shared-ddd'
import { User } from '@simplefeed/user'
import { Feed } from '../feed'

export class FeedActivated implements IDomainEvent {
  public timestamp: Date

  /** `subscribers` asked for the feed and get subscribed to its channel */
  constructor(readonly feed: Feed, readonly subscribers: User[]) {
    this.timestamp = new Date()
  }

  getAggregateId(): string {
    return this.feed.id
  }
}
