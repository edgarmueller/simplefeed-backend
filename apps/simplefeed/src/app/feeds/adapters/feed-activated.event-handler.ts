import { Logger } from '@nestjs/common'
import { EventsHandler } from '@nestjs/cqrs'
import { FeedActivated } from '@simplefeed/feed'
import { SubscriptionUsecases } from '@simplefeed/user'

/** Everyone who added the feed gets its channel in their feed. */
@EventsHandler(FeedActivated)
export class FeedActivatedEventHandler {
  private logger = new Logger(FeedActivatedEventHandler.name)

  constructor(private readonly subscriptions: SubscriptionUsecases) {}

  async handle(event: FeedActivated) {
    const channel = event.feed.channel.profile.username
    for (const subscriber of event.subscribers) {
      try {
        await this.subscriptions.subscribe(subscriber, channel)
      } catch (error) {
        this.logger.error(`could not subscribe ${subscriber.id} to ${channel}: ${error}`)
      }
    }
  }
}
