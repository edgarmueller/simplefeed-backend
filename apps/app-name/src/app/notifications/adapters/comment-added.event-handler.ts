import { Notification, NotificationUsecases } from '@simplefeed/notification';
import { EventsHandler } from "@nestjs/cqrs";
import { CommentAddedEvent } from "@simplefeed/post";
import { Logger } from '@nestjs/common';

@EventsHandler(CommentAddedEvent)
export class CommentAddedEventHandler {
	private logger = new Logger(CommentAddedEventHandler.name)

	constructor(readonly usecases: NotificationUsecases) {
	}

	handle(event: CommentAddedEvent) {
		console.log({ event })
		this.usecases.createNotification(Notification.create({
			recipientId: event.post.author.id,
  		senderId: event.comment.author.id,
  		content: `${event.comment.author.profile.username} commented your post!`,
			opened: false,
  		viewed: false,
  		type: 'comment-posted',
		  resourceId: event.comment.id
		}));	
	}
}