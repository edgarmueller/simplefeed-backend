import { RequestWithUser } from './../../../../../libs/schematics/src/auth/templates/lib/interfaces/request-with-user.interface';
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../../../libs/auth/src";
import { ConversationRepository } from "../../../../../libs/chat/src/lib/conversation.repository";

@Controller('chat')
export class ChatController {

	constructor(readonly conversationRepository: ConversationRepository) {

	}

	@Get()
	@UseGuards(JwtAuthGuard)
	async getConversatios(@Req() req: RequestWithUser) {
		return this.conversationRepository.findByUserId(req.user.id);
	}
}