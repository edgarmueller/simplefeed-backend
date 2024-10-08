import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  BaseWsExceptionFilter,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from '@nestjs/websockets';
import { AuthService } from '@simplefeed/auth';
import { ChatUsecases } from '@simplefeed/chat';
import { Server, Socket } from 'socket.io';
import { Incoming, Outgoing } from './chat.constants';
import { JoinConversationDto } from '../dto/join-conversation.dto';
import { MarkMessageAsReadDto } from '../dto/mark-message-as-read.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { RequestMessagesDto } from '../dto/request-messages.dto';
import { GetMessageDto } from '../dto/get-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: 'chat',
  pingTimeout: 60000,
  pingInterval: 15000,
})
@UseFilters(BaseWsExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatGateway implements OnGatewayConnection {

  private readonly logger = new Logger(ChatGateway.name)

  @WebSocketServer()
  server: Server

  constructor(
    readonly authService: AuthService,
    readonly usecases: ChatUsecases,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const authHeader = socket.handshake.query.Authorization as string
      const user = await this.authService.findOneUserByToken(authHeader)
      this.logger.log(`Fetching conversations for user ${user.id}`)
      const conversations = await this.usecases.findConversationsByUserId(user.id)
      const conversationIds = conversations.map((c) => c.id)
      await socket.join(conversationIds)
      socket.emit('conversations_joined', { conversationIds })
    } catch (error) {
      // we can't use WsException here, see https://github.com/nestjs/nest/issues/336
      console.log(`[handleConnection] ${error}`)
      this.logger.error(`[handleConnection] ${error}`)
      this.logger.error(error)
      socket.disconnect()
    }
  }

  @SubscribeMessage(Incoming.JOIN_CONVERSATION)
  async joinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe({ transform: true })) dto: JoinConversationDto
  ) {
    try {
      const user = await this.authService.findOneUserByToken(dto.auth)
      const conversation = await this.usecases.findConversationById(
        dto.conversationId, 
        user.id
      )
      await socket.join(conversation.id)
    } catch (error) {
      this.logger.error(`[joinConversation] ${error}`)
      this.logger.error(error)
      throw new WsException(error.message)
    }
  }

  // client sent a message
  @SubscribeMessage(Incoming.SEND_MESSAGE)
  async listenForMessages(
    @MessageBody() dto: SendMessageDto,
  ) {
    try {
      const author = await this.authService.findOneUserByToken(dto.auth)
      const conversationId = dto.message.conversationId
      const msg = await this.usecases.addMessageToConversation(
        conversationId,
        author.id,
        dto.message.content
      )
      // send message to all participants
      this.server.to(conversationId).emit(Outgoing.RECEIVE_MESSAGE, GetMessageDto.fromDomain(msg))
    } catch (error) {
      this.logger.error(`[listenForMessages] ${error}`)
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage(Incoming.MARK_AS_READ)
  async markAsRead(
    @MessageBody(new ValidationPipe({ transform: true })) dto: MarkMessageAsReadDto
  ) {
    try {
      const conversationId = dto.conversationId
      const user = await this.authService.findOneUserByToken(dto.auth)
      await this.usecases.markMessagesAsRead(user, conversationId)
      this.server.to(conversationId).emit(Outgoing.MESSAGE_READ, { conversationId, userId: user.id })
    } catch (error) {
      this.logger.error(`[markAsRead] ${error}`)
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage(Incoming.REQUEST_MESSAGES)
  async requestMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: RequestMessagesDto
  ) {
    try {
      const user = await this.authService.findOneUserByToken(dto.auth)
      const conversation = await this.usecases.findConversationById(
        dto.conversationId,
        user.id,
        dto.page
      );
      socket.emit(Outgoing.SEND_MESSAGES, conversation)
    } catch (error) {
      this.logger.error(`[requestMessagesError] ${error}`)
      throw new WsException(error.message)
    }
  }
}
