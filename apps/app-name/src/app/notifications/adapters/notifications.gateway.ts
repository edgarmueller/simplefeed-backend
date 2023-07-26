import { Get, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { NotificationUsecases } from '@simplefeed/notification';
import { Server, Socket } from 'socket.io';
import { GetNotificationDto } from '../../../../../../libs/notification/src/lib/dto/get-notification.dto';
import { NotificationCreatedEvent } from '../../../../../../libs/notification/src/lib/events/notification-created.event';

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

  private logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server

  constructor(
    readonly authService: AuthService,
    readonly usecases: NotificationUsecases,
  ) {}

  handle(event: NotificationCreatedEvent) {
    this.server.to(`notifications-${event.notification.recipientId}`).emit('receive_notification', GetNotificationDto.fromDomain(event.notification))
  }

  async handleConnection(socket: Socket) {
    try {
      const authHeader = socket.handshake.headers.authorization
      const user = await this.authService.getUserFromHeader(authHeader)
      const notifications = await this.usecases.findUnviewedNotificationsForUserId(user.id)
      socket.join(`notifications-${user.id}`)
      await socket.to(`notifications-${user.id}`).emit('send_all_notifications', notifications)
    } catch (error) {
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }

  // FIXME: usecase?
  @SubscribeMessage('mark_notification_as_read')
  async listenForMessages(
    @MessageBody(new ValidationPipe({ transform: true })) rawBody: any,
    @ConnectedSocket() socket: Socket
  ) {
    try {
      console.log({ rawBody })
      const body = rawBody;
      console.log({ body })
      const authHeader = socket.handshake.headers.authorization
      const user = await this.authService.getUserFromHeader(authHeader)
      const readNotification = await this.usecases.markNotificationAsRead(body.notificationId);
      this.logger.log(`User ${user.id} marked notification ${body.notificationId} as read`)
      this.logger.log(`body: ${JSON.stringify(body)}`)
      socket.to(`notifications-${user.id}`).emit('notification_read', GetNotificationDto.fromDomain(readNotification))
      socket.emit('notification_read', GetNotificationDto.fromDomain(readNotification))
    } catch (error) {
      throw new WsException('Invalid credentials.')
    }
  }

  @SubscribeMessage('request_all_notifications')
  async requestAllMessages(
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const authHeader = socket.handshake.headers.authorization
      const user = await this.authService.getUserFromHeader(authHeader)
      this.logger.log(`User ${user.id} requested all notifications`)
      const notifications = await this.usecases.findUnviewedNotificationsForUserId(
        user.id
      )

      socket.emit('send_all_notification', notifications)
    } catch (error) {
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }
}
