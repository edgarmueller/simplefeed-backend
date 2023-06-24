import { Message} from "@kittgen/chat"

export class GetMessageDto {
		constructor(props) {
				Object.assign(this, props);
		}
		static fromDomain(message: Message) {
				return new GetMessageDto({
						id: message.id,
						authorId: message.authorId,
						content: message.content,
						createdAt: message.createdAt,
				});
		}
}