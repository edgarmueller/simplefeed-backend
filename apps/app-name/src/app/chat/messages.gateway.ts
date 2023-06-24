import {
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { ChatService } from './chat.service'

@WebSocketGateway()
export class MessagesGateway {
  @WebSocketServer()
  server: Server

  constructor(private readonly chatService: ChatService) {}

  async sendMessage(converationId: string, content: string, author: string) {
    this.server.to(converationId).emit('message', { content, author })
  }

}
