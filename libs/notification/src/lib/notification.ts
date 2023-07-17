import { AggregateRoot, Props, createId } from "@kittgen/shared-ddd";
import { NotificationCreatedEvent } from "./events/notification-created.event";

const PREFIX = 'not'
const createNotificationId = createId(PREFIX)

export class Notification extends AggregateRoot {
  recipientId: string
  senderId: string
  content: string
  opened: boolean
  viewed: boolean
  createdAt?: Date 
  type: string
  resourceId: string
  link?: string

  public static create(props: Props<Notification>, id?: string): Notification {
    const notification = new Notification({ ...props }, id || createNotificationId());
    notification.emitDomainEvent(new NotificationCreatedEvent(notification));
    return notification;
  }

  private constructor(props: Props<Notification>, readonly id: string) {
    super(props, id || createNotificationId())
  }

  markAsRead() {
    this.viewed = true
  }
}