import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth';
import { ChatUsecases, Conversation } from '@simplefeed/chat';

@Controller('chat')
export class ChatController {

	constructor(readonly usecases: ChatUsecases) {

	}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getConversations(@Req() req: RequestWithUser): Promise<Conversation[]> {
		return this.usecases.findConversationsByUserIdWithMessages(req.user.id);
	}
}