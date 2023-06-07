import { EventsHandler } from "@nestjs/cqrs";
import { UsersRepository } from "@kittgen/user";
import { PostUnlikedEvent } from "../events/post-unliked.event";

@EventsHandler(PostUnlikedEvent)
export class PostUnLikedEventHandler {

	constructor(
		private readonly usersRepository: UsersRepository,
	) {}

	async handle(event: PostUnlikedEvent) {
		console.log('xxx')
    await this.usersRepository.save(event.unlikedBy);
	}
}