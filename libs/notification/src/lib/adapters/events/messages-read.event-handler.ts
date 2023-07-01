import { EventsHandler } from "@nestjs/cqrs";
import { MessagesReadEvent } from "@simplefeed/chat";
import { NotificationsRepository } from "../../notifications.repository";
import { Logger } from "@nestjs/common";

@EventsHandler(MessagesReadEvent)
export class MessagesReadEventHandler {

	private readonly logger = new Logger(MessagesReadEventHandler.name)

	constructor(readonly notificationsRepository: NotificationsRepository) {}

	async handle(event: MessagesReadEvent) {
		const notifications = await this.notificationsRepository.findManyUnreadByRecipientAndResourceIds(
			event.messages.map(message => message.id),
			event.userId
		)
		this.logger.log(`Marking ${notifications.length} notifications as read`)
		notifications.forEach(notification => notification.markAsRead())
		await this.notificationsRepository.saveMany(notifications)
	}
}
