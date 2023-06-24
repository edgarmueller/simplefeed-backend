import { UsersRepository } from '@kittgen/user';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConversationRepository } from './conversation.repository';
import { Conversation } from './conversation';
import { Message } from './message';
import { GetConversationDto } from '../../../../apps/app-name/src/app/chat/dto/get-conversation.dto';

@Injectable()
export class ChatUsecases {

  readonly logger = new Logger(ChatUsecases.name)

  constructor(
    readonly conversationsRepo: ConversationRepository,
    readonly userRepository: UsersRepository
  ) {}

  async createConversation(participantIds: string[]) {
    const existingConversation = await this.conversationsRepo.findConversationByParticipantIds(participantIds);
    if (existingConversation) {
      console.log('existing conversation', existingConversation);
      return existingConversation;
    }
    const conversation = Conversation.create({
      userIds: participantIds,
      messages: [],
    })
    return await this.conversationsRepo.saveConversation(conversation)
  }

  async addMessageToConversation(conversation: Conversation, message: Message) {
    console.log('saving message', message);
    conversation.addMessage(message)
    return await this.conversationsRepo.saveMessage(message)
  }

  async findConversationById(id: string, userId: string) {
    const converation = await this.conversationsRepo.findOneById(id);
    if (!converation.userIds.includes(userId)) {
      this.logger.warn('user not in conversation', converation, userId)
      throw new ForbiddenException()
    }
    return converation
  }

  async findConversationsByUserId(userId: string): Promise<GetConversationDto[]> {
    const conversations = await this.conversationsRepo.findByUserId(userId);
    return conversations.map(GetConversationDto.fromDomain);
  }
}
