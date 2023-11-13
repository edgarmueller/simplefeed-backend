
export class Incoming {
	static RequestAllNotifications = 'request_all_notifications'
  static MarkNotificationAsRead = 'mark_notification_as_read'
}

export class Outgoing {
	static SendAllNotifications = 'send_all_notifications'
	static NotificationRead = 'notification_read'
	static ReceiveNotification = 'receive_notification'
}

export const NotificationRoomId = (userId: string) => `notifications-${userId}`