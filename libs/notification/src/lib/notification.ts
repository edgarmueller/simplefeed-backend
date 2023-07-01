import { AggregateRoot, Props, createId } from "@kittgen/shared-ddd";

const PREFIX = 'not'
const createNotificationId = createId(PREFIX)

export class Notification extends AggregateRoot {
  recipientId: string
  senderId: string
  isRead: boolean
  createdAt?: Date 
  type: string
  resourceId: string

  public static create(props: Props<Notification>, id?: string): Notification {
    const message = new Notification({ ...props }, id || createNotificationId());
    return message;
  }

  private constructor(props: Props<Notification>, readonly id: string) {
    super(props, id || createNotificationId())
  }

  markAsRead() {
    this.isRead = true
  }
}