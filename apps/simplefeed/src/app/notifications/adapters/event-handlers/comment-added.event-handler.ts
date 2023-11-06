import { Logger } from '@nestjs/common'
import { EventsHandler } from '@nestjs/cqrs'
import { Notification, NotificationUsecases } from '@simplefeed/notification'
import { CommentAddedEvent } from '@simplefeed/post'

@EventsHandler(CommentAddedEvent)
export class CommentAddedEventHandler {
  private logger = new Logger(CommentAddedEventHandler.name)

  constructor(readonly usecases: NotificationUsecases) {}

  handle(event: CommentAddedEvent) {
    if (event.comment.parentComment) {
			console.log({ event })
      this.usecases.createNotification(
        Notification.create({
          recipientId: event.comment.parentComment.author.id,
          senderId: event.comment.author.id,
          content: `${event.comment.author.profile.username} replied to your comment!`,
          opened: false,
          viewed: false,
          type: 'comment-replied',
          resourceId: event.comment.id,
        link: `/posts/${event.post.id}`,
        })
      )
      return
    }
    this.usecases.createNotification(
      Notification.create({
        recipientId: event.post.author.id,
        senderId: event.comment.author.id,
        content: `${event.comment.author.profile.username} commented your post!`,
        opened: false,
        viewed: false,
        type: 'comment-posted',
        resourceId: event.comment.id,
        link: `/posts/${event.post.id}`,
      })
    )
  }
}
