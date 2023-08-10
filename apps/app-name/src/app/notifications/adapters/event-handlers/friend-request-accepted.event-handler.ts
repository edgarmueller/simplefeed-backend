import { EventsHandler } from "@nestjs/cqrs";
import { FriendRequestAccepted } from "@simplefeed/user";
import { Notification, NotificationUsecases } from "@simplefeed/notification";

@EventsHandler(FriendRequestAccepted)
export class FriendRequestAcceptedEventHandler {

	constructor(readonly notificiationUseCases: NotificationUsecases) {
	}

	async handle(event: FriendRequestAccepted) {
		await this.notificiationUseCases.createNotification(Notification.create({
			recipientId: event.friendRequest.from.id,
  		senderId: event.friendRequest.to.id,
  		content: `Your friend request to ${event.friendRequest.to.profile.username} was accepted!`,
			opened: false,
  		viewed: false,
  		type: 'friend-request-accepted',
		  resourceId: event.friendRequest.id,
			link: '/friends'
		}))
	}
}
