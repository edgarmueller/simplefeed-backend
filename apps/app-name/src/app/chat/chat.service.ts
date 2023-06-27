import { Injectable } from '@nestjs/common'
import { AuthService } from '@simplefeed/auth'
import { Socket } from 'socket.io'
import { WsException } from '@nestjs/websockets'

@Injectable()
export class ChatService {
  constructor(private readonly authService: AuthService) {}

  async getUserFromSocket(socket: Socket) {
    const authHeader = socket.handshake.headers.authorization
    const user = await this.authService.findOneUserByToken(authHeader)
    if (!user) {
      throw new WsException('Invalid credentials.')
    }
    return user
  }
}
