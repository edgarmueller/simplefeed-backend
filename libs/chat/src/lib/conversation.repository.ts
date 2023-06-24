import { DomainEvents } from '@kittgen/shared-ddd'
import { Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Transactional } from 'typeorm-transactional'
import { Conversation } from './conversation'
import { Message } from './message'

export const DEFAULT_COMMENTS_LIMIT = 10

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async saveConversation(conversation: Conversation): Promise<Conversation> {
    const savedPost = await this.conversationRepository.save(conversation)
    DomainEvents.dispatchEventsForAggregate(conversation.id, this.publisher)
    return savedPost
  }

  @Transactional()
  async saveMessage(message: Message): Promise<Message> {
    const savedMessage = await this.messageRepository.save(message)
    DomainEvents.dispatchEventsForAggregate(
      savedMessage.conversation.id,
      this.publisher
    )
    return savedMessage
  }

  async findOneById(id: string): Promise<Conversation> {
    return this.conversationRepository.findOne({ where: { id }, relations: ['messages'] })
  
  }

	findByUserId(userId: string) {
    return this.conversationRepository.createQueryBuilder('conversation')
      .where('user_ids::jsonb @> :userId', {
        userId: `["${userId}"]`
    }).getMany();
	}
  
  async findConversationByParticipantIds(participantIds: string[]) {
    return this.conversationRepository.createQueryBuilder('conversation')
      .where('user_ids::jsonb = :userIds', {
        userIds: JSON.stringify(participantIds)
    }).getOne();
  }
}
