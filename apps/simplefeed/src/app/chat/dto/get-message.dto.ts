import { Message} from "@simplefeed/chat"

export class GetMessageDto {
		constructor(props) {
				Object.assign(this, props);
		}
		static fromDomain(message: Message) {
				return new GetMessageDto({
						id: message.id,
						conversationId: message.conversationId,
						authorId: message.authorId,
						content: message.content,
						createdAt: message.createdAt,
						isRead: message.isRead,
				});
		}
}