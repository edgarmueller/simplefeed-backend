export class GetNotificationDto {
		id: string;
		recipientId: string;
		resourceId: string;
		isRead: boolean;
		createdAt: Date;
}