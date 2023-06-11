import { UsersRepository } from "@kittgen/user";
import { EventsHandler } from "@nestjs/cqrs";
import { FriendRequestAccepted } from "../../../../../libs/user/src/lib/events/friend-request-accepted.event";

@EventsHandler(FriendRequestAccepted)
export class FriendRequestAcceptedHandler {

	constructor(
		private readonly userRepository: UsersRepository,
	) {}

	async handle(event: FriendRequestAccepted) {
    await this.userRepository.saveMany([event.friendRequest.from, event.friendRequest.to]);
	}
}