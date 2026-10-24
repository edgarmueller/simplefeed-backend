import { EventsHandler } from "@nestjs/cqrs";
import { SubscribedToChannel } from "@simplefeed/user";
import { ChatUsecases } from "@simplefeed/chat";

/** Subscribers tune a channel by chatting with it. */
@EventsHandler(SubscribedToChannel)
export class SubscribedToChannelEventHandler {

	constructor(readonly usecases: ChatUsecases) {
	}

	async handle(event: SubscribedToChannel) {
		await this.usecases.createConversation([event.subscriber.id, event.channel.id]);
	}
}
