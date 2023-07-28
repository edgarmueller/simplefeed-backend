import { DomainEvents } from '@kittgen/shared-ddd'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional'
import { Conversation } from './conversation'
import { Message } from './message'

export const DEFAULT_COMMENTS_LIMIT = 10

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async saveConversation(conversation: Conversation): Promise<Conversation> {
    conversation.userIds.sort()
    const savedPost = await this.conversationRepository.save(conversation)
    DomainEvents.dispatchEventsForAggregate(conversation.id, this.publisher)
    return savedPost
  }

  @Transactional()
  async saveMessage(message: Message): Promise<Message> {
    const savedMessage = await this.messageRepository.save(message)
    runOnTransactionCommit(() => {
      DomainEvents.dispatchEventsForAggregate(
        savedMessage.conversation.id,
        this.publisher
      )
    })
    return savedMessage
  }

  @Transactional()
  async saveMessages(messages: Message[]): Promise<Message[]> {
    if (messages.length === 0) {
      return []
    }
    const savedMessages = await this.messageRepository.save(messages)
    runOnTransactionCommit(() => {
      DomainEvents.dispatchEventsForAggregate(
        savedMessages[0].conversationId,
        this.publisher
      )
    })
    return savedMessages
  }

  async findOneByIdAndUserIdOrFail(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.findOneByIdWithMessagesOrFail(conversationId)
    if (!conversation.userIds.includes(userId)) {
      // TODO: shortcut as no domain error
      throw new ForbiddenException()
    }
    return conversation
  }

  async findOneByIdWithMessagesOrFail(id: string): Promise<Conversation> {
    return this.conversationRepository.findOne({
      where: { id },
      relations: ['messages'],
      order: {
        messages: {
          createdAt: 'ASC',
        }
      },
    })
  }

  findByUserId(userId: string) {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .where('user_ids::jsonb @> :userId', {
        userId: `["${userId}"]`,
      })
      .getMany()
  }

  findByUserIdWithMessages(userId: string) {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect(
        'conversation.messages',
        'message',
        'message.deleted_at IS NULL AND message.conversationId = conversation.id'
      )
      .where('user_ids::jsonb @> :userId', {
        userId: `["${userId}"]`,
      })
      .getMany()
  }

  async findConversationByParticipantIds(participantIds: string[]) {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .where('user_ids::jsonb = :userIds', {
        userIds: JSON.stringify(participantIds),
      })
      .getOne()
  }

  findUnreadMessageByUserAndConversationId(
    userId: string,
    converationId: string
  ) {
    return this.messageRepository.find({
      where: {
        recipientId: userId,
        isRead: false,
        conversation: {
          id: converationId,
        },
      },
      relations: {
        conversation: true,
      },
    })
  }
}
