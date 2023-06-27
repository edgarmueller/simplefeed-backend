import { EventsHandler } from "@nestjs/cqrs";
import { UsersRepository } from "@simplefeed/user";
import { PostLikedEvent } from "../events/post-liked.event";

@EventsHandler(PostLikedEvent)
export class PostLikedEventHandler {

	constructor(
		private readonly usersRepository: UsersRepository,
	) {}

	async handle(event: PostLikedEvent) {
    await this.usersRepository.save(event.likedBy);
	}
}