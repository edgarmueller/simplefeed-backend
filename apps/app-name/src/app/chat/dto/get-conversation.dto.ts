import { Conversation } from '@kittgen/chat';
import { GetMessageDto } from './get-message.dto';
export class GetConversationDto {

	id: string;
	participantIds: string[];
	messages: GetMessageDto[];

	constructor(props: Partial<GetConversationDto>) {
		Object.assign(this, props);
	}

	static fromDomain(conversation: Conversation): GetConversationDto {
		return new GetConversationDto({
			id: conversation.id,
			participantIds: conversation.userIds.map((participantId) => participantId),
			messages: conversation?.messages?.map((message) => GetMessageDto.fromDomain(message)) || [],
		});
	}
}