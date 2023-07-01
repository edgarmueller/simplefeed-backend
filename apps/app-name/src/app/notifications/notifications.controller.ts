import { GetMessageDto } from '@simplefeed/chat'
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, RequestWithUser } from "@simplefeed/auth";
import { NotificationUsecases } from "@simplefeed/notification";

@Controller('notifications')
export class NotificationsController {

	constructor(readonly usecases: NotificationUsecases) {
	}

	@Get('unread')
	@UseGuards(JwtAuthGuard)
	async getUnreadMessages(@Req() req: RequestWithUser): Promise<GetMessageDto[]> {
		return this.usecases.findUnreadNotificationsForUserId(req.user.id);
	}
}