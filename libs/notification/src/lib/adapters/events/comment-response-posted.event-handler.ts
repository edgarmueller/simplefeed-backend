import { EventsHandler } from "@nestjs/cqrs";

@EventsHandler()
export class CommentResponsePostedEventHandler {
	handle() {

	}
}