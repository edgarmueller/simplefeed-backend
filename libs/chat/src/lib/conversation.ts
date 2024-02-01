import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd'
import { ConversationAddedEvent } from './events/conversation-added.event'
import { Message } from './message'
import { MessagesReadEvent } from './events/messages-read.event'
import { MessageAddedEvent } from './events/message-added.event'

const PREFIX = 'conv'
const createConversationId = createId(PREFIX)

export class Conversation extends AggregateRoot {
  userIds: string[]
  messages: Message[]
  createdAt?: Date
  deletedAt?: Date

  public static create(props: Props<Conversation>, id?: string): Conversation {
    const conversation = new Conversation(
      { ...props },
      id || createConversationId()
    )
    const isNewConversation = !!id === false
    if (isNewConversation) {
      conversation.emitDomainEvent(new ConversationAddedEvent(conversation))
    }
    return conversation
  }

  private constructor(props: Props<Conversation>, readonly id: string) {
    super(props, id)
  }

  addMessage(message: Message) {
    if (!this.messages) {
      this.messages = []
    }
    this.messages.push(message)
    message.conversation = this
    this.emitDomainEvent(new MessageAddedEvent(this, message))
  }

  markMessagesAsRead(userId: string) {
    const unreadMsgs = this.messages
      .filter((msg) => msg.recipientId === userId).filter(msg => !msg.isRead)
    unreadMsgs.forEach((msg) => {
      msg.isRead = true
      msg.conversationId = this.id
    })
    if (unreadMsgs.length > 0) {
      this.emitDomainEvent(new MessagesReadEvent(unreadMsgs, this.id, userId))
    }
    return unreadMsgs
  }

  hasMessage(messageId: string) {
    return this.messages.some((msg) => msg.id === messageId)
  }
}
