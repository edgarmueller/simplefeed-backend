import { Notification } from "../notification";

export class GetNotificationDto {
		id: string;
		recipientId: string;
		resourceId: string;
		viewed: boolean;
		opened: boolean;
		createdAt: Date;
		message: string;
		link: string;

    static fromDomain(notification: Notification): GetNotificationDto {
      return {
				id: notification.id,
				recipientId: notification.recipientId,
				resourceId: notification.resourceId,
				viewed: notification.viewed,
				opened: notification.opened,
				createdAt: notification.createdAt,
				message: notification.content,
				link: notification.link,
			}
    }
}