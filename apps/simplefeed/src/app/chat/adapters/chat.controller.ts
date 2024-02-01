import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth';
import { ChatUsecases} from '@simplefeed/chat';
import { GetConversationDto } from "../dto/get-conversation.dto";
import { GetMessageDto } from "../dto/get-message.dto";

@Controller('chat')
export class ChatController {

	constructor(readonly usecases: ChatUsecases) {

	}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getConversations(@Req() req: RequestWithUser): Promise<GetConversationDto[]> {
		const conversations = await this.usecases.findConversationsByUserIdWithUnreadMessages(req.user.id);
		return conversations.map((conversation) => {
			const conversationDto = GetConversationDto.fromDomain(conversation);
			conversationDto.messages = conversation.messages.map(GetMessageDto.fromDomain);
			return conversationDto;
		})
	}
}