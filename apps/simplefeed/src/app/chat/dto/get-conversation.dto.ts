import { Conversation } from '@simplefeed/chat';
import { GetMessageDto } from './get-message.dto';
export class GetConversationDto {

	id: string;
	userIds: string[];
	messages: GetMessageDto[];

	constructor(props: Partial<GetConversationDto>) {
		Object.assign(this, props);
	}

	static fromDomain(conversation: Conversation): GetConversationDto {
		return new GetConversationDto({
			id: conversation.id,
			userIds: conversation.userIds.map((participantId) => participantId),
			messages: conversation?.messages?.map((message) => GetMessageDto.fromDomain(message)) || [],
		});
	}
}