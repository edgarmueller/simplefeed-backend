import { EventsHandler } from "@nestjs/cqrs";
import { FriendRequestAccepted } from "@kittgen/user";
import { ChatUsecases } from "../chat.usecases";

@EventsHandler(FriendRequestAccepted)
export class FriendRequestAcceptedEventHandler {

	constructor(readonly usecases: ChatUsecases) {
	}

	handle(event: FriendRequestAccepted) {
		const participantIds = [event.friendRequest.from.id, event.friendRequest.to.id]
		this.usecases.createConversation(participantIds);	
	}
}
