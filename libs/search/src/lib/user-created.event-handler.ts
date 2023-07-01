import { EventsHandler } from "@nestjs/cqrs";
import { UserCreatedEvent } from "@simplefeed/user";
import { SearchService } from "./search.service";
import { Logger } from "@nestjs/common";

@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler {

	private readonly logger = new Logger(UserCreatedEventHandler.name)

	constructor(readonly searchService: SearchService) {

	}

	handle(event: UserCreatedEvent) {
		this.logger.log('Indexing user', event.user.id)
		this.searchService.indexUser(event.user)		
	}
}
