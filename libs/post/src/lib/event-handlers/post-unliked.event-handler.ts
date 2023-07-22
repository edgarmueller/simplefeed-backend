import { EventsHandler } from "@nestjs/cqrs";
import { UsersRepository } from "@simplefeed/user";
import { PostUnlikedEvent } from "../events/post-unliked.event";

@EventsHandler(PostUnlikedEvent)
export class PostUnlikedEventHandler {

	constructor(
		private readonly usersRepository: UsersRepository,
	) {}

	async handle(event: PostUnlikedEvent) {
    await this.usersRepository.save(event.unlikedBy);
	}
}