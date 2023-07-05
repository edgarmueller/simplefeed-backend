import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { AuthService } from '@simplefeed/auth';
import { ChatUsecases, Message } from '@simplefeed/chat';
import { Server, Socket } from 'socket.io';
import { GetConversationDto, GetMessageDto } from '@simplefeed/chat';
import { WebsocketExceptionsFilter } from '../websocket.exception-filter';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
@UseFilters(WebsocketExceptionsFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  constructor(
    readonly authService: AuthService,
    readonly usecases: ChatUsecases,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      await this.authService.getUserFromSocket(socket)
      console.log('client connected')
    } catch (error) {
      console.log(error)
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }

  // FIXME: usecase?
  @SubscribeMessage('send_message')
  async listenForMessages(
    @MessageBody(new ValidationPipe({ transform: true })) rawBody: any,
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const body = JSON.parse(rawBody)
      const author = await this.authService.getUserFromSocket(socket)
      // dont load all messages
      const conv = await this.usecases.findConversationById(
        body.conversationId,
        author.id
      )
      const msg = await this.usecases.addMessageToConversation(
        conv,
        Message.create({
          content: body.content,
          authorId: author.id,
          recipientId: conv.userIds.find((id) => id !== author.id),
          isRead: false,
          conversationId: body.conversationId,
        })
      )
      // push into usecase, or use events?
      this.server.sockets.emit('receive_message', GetMessageDto.fromDomain(msg))
    } catch (error) {
      console.log(error)
      throw new WsException('Invalid credentials.')
    }
  }

  @SubscribeMessage('mark_as_read')
  async markAsRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe({ transform: true })) body: any
  ) {
    try {
      const user = await this.authService.getUserFromSocket(socket)
      const conversation = await this.usecases.findConversationById(
        body.conversationId,
        user.id
      )
      this.usecases.markMessagesAsRead(user.id, conversation.id)
      socket.emit('mark_as_read', { conversationId: conversation.id, userId: user.id })
    } catch (error) {
      console.log(error)
      throw new WsException('Invalid credentials.')
    }
  }

  // FIXME: usecase?
  @SubscribeMessage('request_all_messages')
  async requestAllMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe({ transform: true })) body: any
  ) {
    try {
      console.log('request_all_messages', body, typeof body)
      const parsedBody = body; // JSON.parse(body)
      const user = await this.authService.getUserFromSocket(socket)
      const conversation = await this.usecases.findConversationById(
        parsedBody.conversationId,
        user.id
      );

      socket.emit('send_all_messages', GetConversationDto.fromDomain(conversation))
    } catch (error) {
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }
}
