import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ChatService } from './chat.service'
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common'
import { WebsocketExceptionsFilter } from './websocket.exception-filter'
import { ChatUsecases } from './chat.usecases'
import { Message } from '@kittgen/chat'
import { GetConversationDto } from './dto/get-conversation.dto'
import { GetMessageDto } from './dto/get-message.dto'

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
    private readonly chatService: ChatService,
    readonly usecases: ChatUsecases
  ) {}

  async handleConnection(socket: Socket) {
    try {
      await this.chatService.getUserFromSocket(socket)
      console.log('client connected')
    } catch (error) {
      console.log(error)
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }

  @SubscribeMessage('send_message')
  async listenForMessages(
    @MessageBody(new ValidationPipe({ transform: true })) rawBody: any,
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const body = JSON.parse(rawBody)
      const author = await this.chatService.getUserFromSocket(socket)
      console.log(author, body.conversationId)
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
          conversationId: body.conversationId,
        })
      )
      console.log('saved message', msg)
      // push into usecase, or use events?
      this.server.sockets.emit('receive_message', GetMessageDto.fromDomain(msg))
    } catch (error) {
      console.log(error)
      throw new WsException('Invalid credentials.')
    }
  }

  @SubscribeMessage('request_all_messages')
  async requestAllMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody(new ValidationPipe({ transform: true })) body: any
  ) {
    try {
      console.log('request_all_messages', body, typeof body)
      const parsedBody = body; // JSON.parse(body)
      const user = await this.chatService.getUserFromSocket(socket)
      const conversation = await this.usecases.findConversationById(
        parsedBody.conversationId,
        user.id
      )

      socket.emit('send_all_messages', GetConversationDto.fromDomain(conversation))
    } catch (error) {
      socket.emit('error', { message: 'Invalid credentials.' })
      socket.disconnect()
    }
  }
}
