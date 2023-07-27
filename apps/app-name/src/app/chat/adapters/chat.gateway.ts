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
import { JoinConversationDto } from './dto/join-conversation.dto';
import { MarkMessageAsReadDto } from './dto/mark-message-as-read.dto';
import { RequestAllMessagesDto } from './dto/request-all-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
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
      const authHeader = socket.handshake.headers.authorization
      const user = await this.authService.findOneUserByToken(authHeader)
      const conversations = await this.usecases.findConversationsByUserId(user.id)
      await socket.join(conversations.map((c) => c.id))
    } catch (error) {
      // we can't use WsException here, see https://github.com/nestjs/nest/issues/336
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
      const authHeader = socket.handshake.headers.authorization
      const user = await this.authService.findOneUserByToken(authHeader)
      const conversation = await this.usecases.findConversationById(
        dto.conversationId, 
        user.id
      )
      await socket.join(conversation.id)
    } catch (error) {
      this.logger.error(error)
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage(Incoming.SEND_MESSAGE)
  async listenForMessages(
    @MessageBody() dto: SendMessageDto,
  ) {
    try {
      const author = await this.authService.findOneUserByToken(dto.auth.Authorization)
      const conversationId = dto.message.conversationId
      const msg = await this.usecases.addMessageToConversation(
        conversationId,
        author.id,
        dto.message.content
      )
      this.server.to(conversationId).emit(Outgoing.RECEIVE_MESSAGE, msg)
    } catch (error) {
      this.logger.error(error)
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage(Incoming.MARK_AS_READ)
  async markAsRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe({ transform: true })) dto: MarkMessageAsReadDto
  ) {
    try {
      const authHeader = socket.handshake.headers.authorization
      const conversationId = dto.conversationId
      const user = await this.authService.findOneUserByToken(authHeader)
      await this.usecases.markMessagesAsRead(user, conversationId)
      this.server.to(conversationId).emit(Outgoing.MESSAGE_READ, { conversationId, userId: user.id })
    } catch (error) {
      this.logger.error(error)
      // TODO: is this the right way to handle WS errors?
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage(Incoming.REQUEST_ALL_MESSAGES)
  async requestAllMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: RequestAllMessagesDto
  ) {
    try {
      const authHeader = socket.handshake.headers.authorization
      const user = await this.authService.findOneUserByToken(authHeader)
      const conversation = await this.usecases.findConversationById(
        dto.conversationId,
        user.id
      );
      socket.emit(Outgoing.SEND_ALL_MESSAGES, conversation)
    } catch (error) {
      this.logger.error(error)
      socket.disconnect(true)
      throw new WsException(error.message)
    }
  }
}
