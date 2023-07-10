import { NotificationUsecases } from '@simplefeed/notification';
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
import { GetNotificationDto } from '../../../../../libs/notification/src/lib/dto/get-notification.dto';
import { EventsHandler } from '@nestjs/cqrs';
import { NotificationCreatedEvent } from '../../../../../libs/notification/src/lib/events/notification-created.event';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
@EventsHandler(NotificationCreatedEvent)
// @UseFilters(WebsocketExceptionsFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  constructor(
    readonly authService: AuthService,
    readonly usecases: NotificationUsecases,
  ) {}

  handle(event: NotificationCreatedEvent) {
    this.server.to(`notifications-${event.notification.recipientId}`).emit('send_notification', GetNotificationDto.fromDomain(event.notification))
  }

  async handleConnection(socket: Socket) {
    try {
      const user = await this.authService.getUserFromSocket(socket)
      const notifications = await this.usecases.findUnviewedNotificationsForUserId(user.id)
      socket.join(`notifications-${user.id}`)
      await socket.to(`notifications-${user.id}`).emit('send_all_notifications', notifications)
    } catch (error) {
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }

  // FIXME: usecase?
  // @SubscribeMessage('send_notification')
  async listenForMessages(
    @MessageBody(new ValidationPipe({ transform: true })) rawBody: any,
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const body = JSON.parse(rawBody)
      const author = await this.authService.getUserFromSocket(socket)
      // dont load all messages
      // const conversation = await this.usecases.findConversationById(
      //   body.conversationId,
      //   author.id
      // )
      // const msg = await this.usecases.addMessageToConversation(
      //   conversation,
      //   Message.create({
      //     content: body.content,
      //     authorId: author.id,
      //     recipientId: conversation.userIds.find((id) => id !== author.id),
      //     isRead: false,
      //     conversationId: body.conversationId,
      //   })
      // )
      // push into usecase, or use events?
      // this.server.to(conversation.id).emit('receive_message', GetMessageDto.fromDomain(msg))
    } catch (error) {
      throw new WsException('Invalid credentials.')
    }
  }

  @SubscribeMessage('mark_notification_as_viewed')
  async markAsRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe({ transform: true })) body: any
  ) {
    try {
      const user = await this.authService.getUserFromSocket(socket)
      // const conversation = await this.usecases.findConversationById(
      //   body.conversationId,
      //   user.id
      // )
      // this.usecases.markMessagesAsRead(user.id, conversation.id)
      // this.server.to(conversation.id).emit('message_read', { conversationId: conversation.id, userId: user.id })
    } catch (error) {
      throw new WsException('Invalid credentials.')
    }
  }

  // FIXME: needed? usecase? also in chat
  @SubscribeMessage('request_all_notifications')
  async requestAllMessages(
    @ConnectedSocket() socket: Socket,
    // @MessageBody(new ValidationPipe({ transform: true })) body: any
  ) {
    try {
      console.log('clien request all notifications')
      const user = await this.authService.getUserFromSocket(socket)
      const notifications = await this.usecases.findUnviewedNotificationsForUserId(
        user.id
      );

      socket.emit('send_all_notification', notifications)
    } catch (error) {
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }
}
