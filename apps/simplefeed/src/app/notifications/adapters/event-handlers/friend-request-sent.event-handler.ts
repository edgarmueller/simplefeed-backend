import { NotificationUsecases } from '@simplefeed/notification';
import { EventsHandler } from "@nestjs/cqrs";
import { FriendRequestSent } from "@simplefeed/user";
import { Notification } from "@simplefeed/notification";
import { Logger } from '@nestjs/common';

@EventsHandler(FriendRequestSent)
export class FriendRequestSentEventHandler {

	private logger = new Logger(FriendRequestSentEventHandler.name)

	constructor(readonly usecases: NotificationUsecases) {
	}

	async handle(event: FriendRequestSent) {
		await this.usecases.createNotification(Notification.create({
			recipientId: event.friendRequest.to.id,
  		senderId: event.friendRequest.from.id,
  		content: `You have a new friend request ${event.friendRequest.from.profile.username}!`,
			opened: false,
  		viewed: false,
  		type: 'friend-request-sent',
		  resourceId: event.friendRequest.id,
			link: '/friends'
		}))
	}
}
