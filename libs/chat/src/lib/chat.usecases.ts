import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';
import { AuthService } from '@simplefeed/auth';
import { User, UserClosedEvent, UsersRepository } from '@simplefeed/user';
import { Conversation } from './conversation';
import { ConversationRepository } from './conversation.repository';
import { Message } from './message';

@Injectable()
@EventsHandler(UserClosedEvent)
export class ChatUsecases {
  readonly logger = new Logger(ChatUsecases.name)

  constructor(
    readonly conversationsRepo: ConversationRepository,
    readonly userRepository: UsersRepository,
    readonly authService: AuthService,
  ) { }

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

  async addMessageToConversation(conversationId: string, authorId: string, messageText: string): Promise<Message> {
    // TODO: don't load all messages
    const conversation = await this.conversationsRepo.findOneByIdAndUserIdOrFail(conversationId, authorId)
    const message = Message.create({
      content: messageText,
      authorId,
      recipientId: conversation.userIds.find((id) => id !== authorId),
      isRead: false,
      conversationId,
    })
    conversation.addMessage(message)
    const savedMessage = await this.conversationsRepo.saveMessage(message)
    return savedMessage
  }

  async findConversationById(id: string, userId: string, page?: number): Promise<Conversation> {
    const conversation = await this.conversationsRepo.findOneByIdWithMessagesOrFail(id, page)
    if (!conversation.userIds.includes(userId)) {
      this.logger.warn(`User not found in conversation: conversation ${conversation.id}, userId ${userId}`)
      throw new ForbiddenException()
    }
    return conversation
  }

  async findConversationsByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationsRepo.findByUserId(userId);
    return conversations
  }

  async findConversationsByUserIds(userIds: string[]): Promise<Conversation> {
    return this.conversationsRepo.findConversationByParticipantIds(userIds);
  }

  async findConversationsByUserIdWithUnreadMessages(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationsRepo.findByUserIdWithMostRecentMessage(userId);
    const unreadMessages = await this.conversationsRepo.findUnreadMessageByUserAndConversationId(userId, conversations.map(c => c.id));
    unreadMessages.forEach((message) => {
      const foundConversation = conversations.find((conversation) => conversation.id === message.conversationId)
      if (!foundConversation.hasMessage(message.id)) {
        foundConversation.addMessage(message);
      }
    });
    return conversations
  }

  async findUnreadMessagesCount(userId: string): Promise<number> {
    return this.conversationsRepo.findUnreadMessageCountByUser(userId)
  }

  async markMessagesAsRead(user: User, conversationId: string): Promise<void> {
    this.logger.log(`Marking messages as read for user ${user.id} in conversation ${conversationId}`)
    const conversation = await this.conversationsRepo.findOneByIdWithUnreadMessagesOrFail(conversationId);
    const unreadMessages = conversation.markMessagesAsRead(user.id);
    await this.conversationsRepo.saveMessages(unreadMessages);
  }

  async handleUserClosed(userId: string) {
    await this.conversationsRepo.deleteByUserId(userId);
  }

  async handleUserReactivated(userId: string) {
    await this.conversationsRepo.restoreByUserId(userId);
  }
}
