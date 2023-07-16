import { EventsHandler } from "@nestjs/cqrs";

@EventsHandler()
export class CommentPostedEventHandler {
	handle() {

	}
}