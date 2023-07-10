import { NotificationUsecases } from '@simplefeed/notification';
import { EventsHandler } from "@nestjs/cqrs";
import { FriendRequestSent } from "@simplefeed/user";
import { Notification } from "@simplefeed/notification";

@EventsHandler(FriendRequestSent)
export class FriendRequestSentEventHandler {

	constructor(readonly usecases: NotificationUsecases) {
	}

	async handle(event: FriendRequestSent) {
		console.log("creating notification for friend request sent")
		await this.usecases.createNotification(Notification.create({
			recipientId: event.friendRequest.to.id,
  		senderId: event.friendRequest.from.id,
  		content: "You have a new friend request!",
			opened: false,
  		viewed: false,
  		type: 'friend-request-sent',
		  resourceId: event.friendRequest.id
		}))
	}
}
