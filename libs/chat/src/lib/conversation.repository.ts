import { DomainEvents } from '@simplefeed/shared-ddd'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
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

  async findOneByIdAndUserIdOrFail(
    conversationId: string,
    userId: string
  ): Promise<Conversation> {
    const conversation = await this.findOneByIdWithMessagesOrFail(
      conversationId
    )
    if (!conversation.userIds.includes(userId)) {
      // TODO: shortcut as no domain error
      throw new ForbiddenException()
    }
    return conversation
  }

  // FIXME: increase page size
  async findOneByIdWithMessagesOrFail(
    id: string,
    page?: number,
    pageSize = 10
  ): Promise<Conversation> {
    const conv = await this.conversationRepository.findOne({
      where: { id },
    })
    conv.messages = await this.messageRepository.find({
      where: {
        conversation: {
          id,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      skip: page ? (page - 1) * pageSize : 0,
      take: pageSize,
    })
    conv.messages.forEach((message) => {
      message.conversationId = conv.id
    })
    return conv
  }

  async findOneByIdWithUnreadMessagesOrFail(id: string): Promise<Conversation> {
    const conv = await this.conversationRepository.findOne({
      where: { id },
    })
    conv.messages = await this.messageRepository.find({
      where: {
        conversation: {
          id,
        },
        isRead: false,
      },
      order: {
        createdAt: 'DESC',
      },
    })
    conv.messages.forEach((message) => {
      message.conversationId = conv.id
    })
    return conv
  }

  findByUserId(userId: string) {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .where('user_ids::jsonb @> :userId', {
        userId: `["${userId}"]`,
      })
      .getMany()
  }

  async findByUserIdWithMostRecentMessage(userId: string): Promise<Conversation[]> {
    const conversationsWithMostRecentMessage = await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndMapOne(
        'conversation.message',
        'conversation.messages',
        'message',
        'message.deleted_at IS NULL AND message.conversationId = conversation.id'
      )
      .where('user_ids::jsonb @> :userId', {
        userId: `["${userId}"]`,
      })
      .orderBy('message.createdAt', 'DESC')
      .getMany()
    // FIXME: types
    return conversationsWithMostRecentMessage.map((c: any) => {
      c.messages = c.message !== null ? [c.message] : []
      delete c.message
      return c
    })
  }

  async findConversationByParticipantIds(participantIds: string[]) {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .where('user_ids::jsonb = :userIds', {
        userIds: JSON.stringify(participantIds),
      })
      .getOne()
  }

  findUnreadMessageCountByUser(userId: string) {
    return this.messageRepository.countBy({
      recipientId: userId,
      isRead: false,
    })
  }

  findUnreadMessageByUserAndConversationId(
    userId: string,
    converationIds: string[]
  ) {
    return this.messageRepository.find({
      where: {
        recipientId: userId,
        isRead: false,
        conversation: {
          id: In(converationIds),
        },
      },
    })
  }

  async deleteByUserId(userId: string) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('user_ids::jsonb @> :userId', {
        userId: `["${userId}"]`,
      })
      .getMany()
    await this.conversationRepository.softDelete({
      id: In(conversations.map((c) => c.id)),
    })
  }

  async restoreByUserId(userId: string) {
    try {
      const conversations = await this.conversationRepository
        .createQueryBuilder('conversation')
        .withDeleted()
        .where('user_ids::jsonb @> :userId', {
          userId: `["${userId}"]`,
        })
        .getMany()
      if (conversations.length > 0) {
        await this.conversationRepository.restore(conversations.map((c) => c.id))
      }
    } catch (error) {
      console.log({ error })
    }
  }
}
