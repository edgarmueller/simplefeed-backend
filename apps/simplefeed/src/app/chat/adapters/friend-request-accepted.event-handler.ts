import { NotificationUsecases } from '@simplefeed/notification';
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
	}
}