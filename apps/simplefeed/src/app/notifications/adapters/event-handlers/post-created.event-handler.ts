import { Logger } from '@nestjs/common'
import { EventsHandler } from '@nestjs/cqrs'
import { Notification, NotificationUsecases } from '@simplefeed/notification'
import { PostCreatedEvent } from '@simplefeed/post'

@EventsHandler(PostCreatedEvent)
export class PostCreatedEventHandler {
  private logger = new Logger(PostCreatedEventHandler.name)

  constructor(readonly usecases: NotificationUsecases) {}

  async handle(event: PostCreatedEvent) {
    // check target & don't self notify 
    if (event.post.postedTo && event.post.author.id !== event.post.postedTo.id) {
      await this.usecases.createNotification(
        Notification.create({
          recipientId: event.post.postedTo.id,
          senderId: event.post.author.id,
          content: `${event.post.author.profile.username} posted to your profile page!`,
          opened: false,
          viewed: false,
          type: 'post-created',
          resourceId: event.post.id,
          link: `/posts/${event.post.id}`
        })
      )
    }
  }
}
