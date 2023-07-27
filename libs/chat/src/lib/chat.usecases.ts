import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { User, UsersRepository } from '@simplefeed/user';
import { AuthService } from '@simplefeed/auth';
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
    readonly userRepository: UsersRepository,
    readonly authService: AuthService,
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

  async addMessageToConversation(conversationId: string, authorId: string, messageText: string): Promise<GetMessageDto> {
    // TODO: dont load all messages
    const conversation = await this.conversationsRepo.findOneByIdAndUserIdOrFail(conversationId, authorId)
    const message = Message.create({
      content: messageText,
      authorId,
      recipientId: conversation.userIds.find((id) => id !== authorId),
      isRead: false,
      conversationId,
    })
    conversation.addMessage(message)
    const savedMessage =  await this.conversationsRepo.saveMessage(message)
    return GetMessageDto.fromDomain(savedMessage);
  }

  async findConversationById(id: string, userId: string): Promise<GetConversationDto> {
    const conversation = await this.conversationsRepo.findOneByIdWithMessagesOrFail(id)
    if (!conversation.userIds.includes(userId)) {
      this.logger.warn('User not found in conversation', conversation, userId)
      throw new ForbiddenException()
    }
    return GetConversationDto.fromDomain(conversation);
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

	async markMessagesAsRead(user: User, conversationId: string): Promise<void> {
    const conversation = await this.conversationsRepo.findOneByIdWithMessagesOrFail(conversationId);
    const unreadMessages = conversation.markMessagesAsRead(user.id);
    await this.conversationsRepo.saveMessages(unreadMessages);
	}
}
