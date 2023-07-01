import { EventsHandler } from "@nestjs/cqrs";
import { MessageAddedEvent } from "@simplefeed/chat";
import { NotificationsRepository } from "../../notifications.repository";
import { Notification } from "../../notification";
import { Logger } from "@nestjs/common";

@EventsHandler(MessageAddedEvent)
export class MessageAddedEventHandler {

	private readonly logger = new Logger(MessageAddedEventHandler.name)

	constructor(readonly notificationsRepository: NotificationsRepository) {}

	async handle(event: MessageAddedEvent) {
		this.logger.log('Creating notification based on message added', event.message.id)
		await this.notificationsRepository.save(Notification.create({
			isRead: false,
			recipientId: event.message.recipientId,
			resourceId: event.message.id,
			senderId: event.message.authorId,
			type: 'message',
		}))
	}
}
