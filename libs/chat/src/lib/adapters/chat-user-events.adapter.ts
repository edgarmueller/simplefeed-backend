import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { UserClosedEvent, UserReactivatedEvent } from "@simplefeed/user"
import { ConversationRepository } from "../conversation.repository";

@EventsHandler(UserClosedEvent, UserReactivatedEvent)
export class ChatUserEventsAdapter implements IEventHandler<UserClosedEvent>, IEventHandler<UserReactivatedEvent> {

	constructor(readonly conversationsRepo: ConversationRepository) {
	}

  async handle(event: UserClosedEvent | UserReactivatedEvent) {
		if (event instanceof UserClosedEvent) {
			await this.conversationsRepo.deleteByUserId(event.user.id);
		} else if (event instanceof UserReactivatedEvent) {
			await this.conversationsRepo.restoreByUserId(event.user.id);
		}
  }
}