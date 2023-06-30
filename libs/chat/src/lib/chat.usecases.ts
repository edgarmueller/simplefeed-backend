import { UsersRepository } from '@simplefeed/user';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConversationRepository } from './conversation.repository';
import { Conversation } from './conversation';
import { Message } from './message';
import { GetConversationDto } from './dto/get-conversation.dto';
import { GetMessageDto } from './dto/get-message.dto';

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

  async findConversationsByUserIdWithmessage(userId: string): Promise<GetConversationDto[]> {
    const conversations = await this.conversationsRepo.findByUserIdWithMessages(userId);
    return conversations.map(GetConversationDto.fromDomain);
  
  }

	async findUnreadMessageByUserId(userId: string): Promise<GetMessageDto[]> {
    const msgs = await this.conversationsRepo.findUnreadMessageByUserId(userId);
    return msgs.map(GetMessageDto.fromDomain);
	}

	async markMessagesAsRead(userId: string, conversationId: string): Promise<void> {
    const msgs = await this.conversationsRepo.findUnreadMessageByUserAndConversationId(userId, conversationId);
    msgs.forEach(msg => {
      msg.isRead = true;
    })
    await this.conversationsRepo.saveMessages(msgs);
	}
}
