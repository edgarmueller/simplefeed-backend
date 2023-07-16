import { EventsHandler } from "@nestjs/cqrs";

@EventsHandler()
export class NotificationCreatedEventHandler {
	handle() {

	}
}