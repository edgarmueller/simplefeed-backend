import { Module } from '@nestjs/common'
import { UserModule } from '@simplefeed/user'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConversationSchema } from './conversation.schema'
import { CqrsModule } from '@nestjs/cqrs'
import { MessageSchema } from './message.schema'
import { ConversationRepository } from './conversation.repository'
import { ChatUsecases } from './chat.usecases'

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([ConversationSchema, MessageSchema]),
    CqrsModule,
  ],
  controllers: [],
  providers: [ConversationRepository, ChatUsecases],
  exports: [ConversationRepository, ChatUsecases]
})
export class ChatModule {}
