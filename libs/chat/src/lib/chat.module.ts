import { Module } from '@nestjs/common'
import { UserModule } from '@simplefeed/user'
import { AuthConfigFactory, AuthModule } from '@simplefeed/auth'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConversationSchema } from './conversation.schema'
import { CqrsModule } from '@nestjs/cqrs'
import { MessageSchema } from './message.schema'
import { ConversationRepository } from './conversation.repository'
import { ChatUsecases } from './chat.usecases'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    UserModule,
    AuthModule.registerAsync({
      imports: [ConfigModule],
      useClass: AuthConfigFactory
    }),
    TypeOrmModule.forFeature([ConversationSchema, MessageSchema]),
    CqrsModule,
  ],
  controllers: [],
  providers: [ConversationRepository, ChatUsecases],
  exports: [ConversationRepository, ChatUsecases]
})
export class ChatModule {}
