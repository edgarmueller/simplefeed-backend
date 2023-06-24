import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd'
import { ConversationAddedEvent } from './events/conversation-added.event'
import { Message } from './message'

const PREFIX = 'conv'
const createConversationId = createId(PREFIX)

export class Conversation extends AggregateRoot {
  userIds: string[]
  messages: Message[]
  createdAt?: Date
  deletedAt?: Date

  public static create(props: Props<Conversation>, id?: string): Conversation {
    const conversation = new Conversation({ ...props }, id || createConversationId())
    const isNewConversation = !!id === false
    if (isNewConversation) {
      conversation.emitDomainEvent(new ConversationAddedEvent(conversation))
    }
    return conversation
  }

  private constructor(props: Props<Conversation>, readonly id: string) {
     super(props, id)
  }

  addMessage(messsage: Message) {
    if (!this.messages) {
      this.messages = []
    }
    this.messages.push(messsage)
    messsage.conversation = this
    this.emitDomainEvent(new ConversationAddedEvent(this))
  }
}
