import { EventsHandler } from '@nestjs/cqrs'
import { NotificationUsecases } from '@simplefeed/notification'
import { PostLikedEvent } from '@simplefeed/post'
import { Notification } from "@simplefeed/notification";
import { Logger } from '@nestjs/common';

@EventsHandler(PostLikedEvent)
export class PostLikedEventHandler {

	private logger = new Logger(PostLikedEventHandler.name)

  constructor(readonly usecases: NotificationUsecases) {}

  async handle(event: PostLikedEvent) {
		this.logger.log("Creating notification for liked post")
    // dont self-notify
    if (event.likedBy.id === event.post.author.id) {
      return
    }
    await this.usecases.createNotification(Notification.create({
      recipientId: event.post.author.id,
      senderId: event.likedBy.id,
      content: `${event.likedBy.profile.username} liked your post!`,
      opened: false,
      viewed: false,
      type: 'post-liked',
      resourceId: event.post.id,
      link: `/posts/${event.post.id}`,
    }))
  }
}
