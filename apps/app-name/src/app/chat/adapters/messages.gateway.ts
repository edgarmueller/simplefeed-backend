import {
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { AuthService } from '@simplefeed/auth'

@WebSocketGateway()
export class MessagesGateway {
  @WebSocketServer()
  server: Server

  constructor(private readonly authService: AuthService) {}

  async sendMessage(converationId: string, content: string, author: string) {
    this.server.to(converationId).emit('message', { content, author })
  }

}
