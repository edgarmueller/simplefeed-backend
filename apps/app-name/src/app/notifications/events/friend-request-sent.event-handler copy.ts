import { EventsHandler } from "@nestjs/cqrs";

@EventsHandler()
export class FriendRequestSentEventHandler {
	handle() {

	}
}