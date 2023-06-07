import { EventsHandler } from "@nestjs/cqrs";
import { UsersRepository } from "@kittgen/user";
import { PostUnlikedEvent } from "../events/post-unliked.event";
import { LikeRepository } from "../like.repository";

@EventsHandler(PostUnlikedEvent)
export class PostUnlikedEventHandler {

	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly likesRepository: LikeRepository,
	) {}

	async handle(event: PostUnlikedEvent) {
		await this.likesRepository.delete(event.like)
    await this.usersRepository.save(event.unlikedBy);
	}
}