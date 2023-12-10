import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';
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
import { NotificationUsecases, NotificationCreatedEvent } from '@simplefeed/notification';
import { Server, Socket } from 'socket.io';
import { GetNotificationDto } from '../dto/get-notification.dto';
import { Incoming, Outgoing, NotificationRoomId } from './notification.constants';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: 'notifications',
})
@EventsHandler(NotificationCreatedEvent)
@UsePipes(new ValidationPipe({ transform: true }))
export class NotificationsGateway implements OnGatewayConnection {

  private logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server

  constructor(readonly authService: AuthService, readonly usecases: NotificationUsecases) { }

  handle(event: NotificationCreatedEvent) {
    const roomId = NotificationRoomId(event.notification.recipientId)
    console.log('handle room id', roomId)
    this.server.to(roomId).emit(Outgoing.ReceiveNotification, GetNotificationDto.fromDomain(event.notification))
  }

  async handleConnection(socket: Socket) {
    try {
      const authHeader = socket.handshake.query.Authorization as string
      const user = await this.authService.findOneUserByToken(authHeader)
      const notifications = await this.usecases.findUnviewedNotificationsForUserId(user.id)
      await socket.join(NotificationRoomId(user.id))
      this.server.to(NotificationRoomId(user.id)).emit(Outgoing.SendAllNotifications, notifications.map(GetNotificationDto.fromDomain))
    } catch (error) {
      throw new WsException(error.message)
    }
  }

  @SubscribeMessage(Incoming.MarkNotificationAsRead)
  async handleMarkNotificationAsRead(
    @MessageBody(new ValidationPipe({ transform: true })) body: any,
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const authHeader = socket.handshake.query.Authorization as string
      const user = await this.authService.findOneUserByToken(authHeader)
      const readNotification = await this.usecases.markNotificationAsRead(body.notificationId);
      this.logger.log(`User ${user.id} marked notification ${body.notificationId} as read`)
      socket.to(`notifications-${user.id}`).emit(Outgoing.NotificationRead, GetNotificationDto.fromDomain(readNotification))
      socket.emit(Outgoing.NotificationRead, GetNotificationDto.fromDomain(readNotification))
    } catch (error) {
      throw new WsException(error.message)
    }
  }

  // @SubscribeMessage(Incoming.RequestAllNotifications)
  // async handleRequestAllNotifications(@ConnectedSocket() socket: Socket) {
  //   try {
  //     const authHeader = socket.handshake.query.Authorization as string
  //     const user = await this.authService.findOneUserByToken(authHeader)
  //     this.logger.log(`User ${user.id} requested all notifications`)
  //     const notifications = await this.usecases.findUnviewedNotificationsForUserId(
  //       user.id
  //     )
  //     socket.emit(Outgoing.SendAllNotifications, notifications.map(GetNotificationDto.fromDomain))
  //   } catch (error) {
  //     throw new WsException(error.message)
  //   }
  // }
}
