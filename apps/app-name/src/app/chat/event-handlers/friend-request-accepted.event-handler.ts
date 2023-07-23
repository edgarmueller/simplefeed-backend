import { Notification, NotificationUsecases } from '@simplefeed/notification';
import { EventsHandler } from "@nestjs/cqrs";
import { FriendRequestAccepted } from "@simplefeed/user";
import { ChatUsecases } from "@simplefeed/chat";

@EventsHandler(FriendRequestAccepted)
export class FriendRequestAcceptedEventHandler {

	constructor(readonly usecases: ChatUsecases, readonly notificationUsecases: NotificationUsecases) {
	}

	async handle(event: FriendRequestAccepted) {
		const participantIds = [event.friendRequest.from.id, event.friendRequest.to.id]
		await this.usecases.createConversation(participantIds);	
		const conversation = await this.usecases.findConversationsByUserIds(participantIds)
		await this.notificationUsecases.createNotification(Notification.create({
			recipientId: event.friendRequest.from.id,
  		senderId: event.friendRequest.to.id,
  		content: `You friend request to ${event.friendRequest.to.profile.username} was accepted!`,
			opened: false,
  		viewed: false,
  		type: 'friend-request-accepted',
		  resourceId: conversation.id,
			link: '/friends'
		}))
	}
}
