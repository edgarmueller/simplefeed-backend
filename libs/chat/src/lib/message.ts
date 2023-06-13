import { AggregateRoot, Entity, Props, createId } from "@kittgen/shared-ddd";
import { User } from "@kittgen/user";
import { Conversation } from "./conversation";
import { MessageAddedEvent } from "./events/message-added.event";

const PREFIX = 'msg'
export type MessageId = string
const createMessageId = createId(PREFIX)

export class Message implements Entity {
  conversation: Conversation
  conversationId: string
  sender: User 
  recipient: User
  content: string;
  createdAt?: Date 
  // sentAt?: Date 
  deletedAt?: Date 

  public static create(props: Props<Message>, id?: string): Message {
    const message = new Message({ ...props }, id);
    const isNewMessage = !!id === false;
    if (isNewMessage) {
      message.conversation.emitDomainEvent(new MessageAddedEvent(message.conversation, message));
    }
    return message;
  }

  private constructor(props: Props<Message>, readonly id: string) {
    Object.assign(this, props)
    this.id = id || createMessageId()
  }
}