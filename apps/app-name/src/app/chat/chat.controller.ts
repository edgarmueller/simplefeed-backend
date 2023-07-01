import { JwtAuthGuard, RequestWithUser   } from '@simplefeed/auth';
import { ChatUsecases, GetConversationDto, GetMessageDto } from '@simplefeed/chat';
import { Controller, Get, Req, UseGuards } from "@nestjs/common";

@Controller('chat')
export class ChatController {

	constructor(readonly usecases: ChatUsecases) {

	}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getConversations(@Req() req: RequestWithUser): Promise<GetConversationDto[]> {
		return this.usecases.findConversationsByUserIdWithmessage(req.user.id);
	}

}