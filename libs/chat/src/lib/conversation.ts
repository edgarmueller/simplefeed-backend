import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd'
import { User } from '@kittgen/user'
import { ConversationAddedEvent } from './events/conversation-added.event'

const PREFIX = 'conv'
const createConversationId = createId(PREFIX)

export class Conversation extends AggregateRoot {
  participants: User[]
  messages: Conversation[]
  createdAt?: Date
  deletedAt?: Date

  public static create(props: Props<Conversation>, id?: string): Conversation {
    const conversation = new Conversation({ ...props }, id)
    const isNewConversation = !!id === false
    if (isNewConversation) {
      conversation.emitDomainEvent(new ConversationAddedEvent(conversation))
    }
    return conversation
  }

  private constructor(props: Props<Conversation>, readonly id: string) {
     super(props, id || createConversationId());
  }
}
