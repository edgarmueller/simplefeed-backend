import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from '@simplefeed/user';
import { Conversation } from './conversation';
import { ConversationRepository } from './conversation.repository';
import { GetConversationDto } from './dto/get-conversation.dto';
import { GetMessageDto } from './dto/get-message.dto';
import { Message } from './message';

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
    const converation = await this.conversationsRepo.findOneByIdWithMessages(id);
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

  async findConversationsByUserIds(userIds: string[]): Promise<Conversation> {
    return this.conversationsRepo.findConversationByParticipantIds(userIds);
  }

  async findConversationsByUserIdWithMessages(userId: string): Promise<GetConversationDto[]> {
    const conversations = await this.conversationsRepo.findByUserIdWithMessages(userId);
    return conversations.map(GetConversationDto.fromDomain);
  
  }

	async findUnreadMessageByUserId(userId: string): Promise<GetMessageDto[]> {
    const msgs = await this.conversationsRepo.findUnreadMessageByUserId(userId);
    return msgs.map(GetMessageDto.fromDomain);
	}

	async markMessagesAsRead(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationsRepo.findOneByIdWithMessages(conversationId);
    const unreadMessages = conversation.markMessagesAsRead(userId);
    await this.conversationsRepo.saveMessages(unreadMessages);
	}
}
