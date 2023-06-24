import { Module } from '@nestjs/common'
import { UserModule } from '@kittgen/user'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConversationSchema } from './conversation.schema'
import { CqrsModule } from '@nestjs/cqrs'
import { MessageSchema } from './message.schema'
import { ConversationRepository } from './conversation.repository'

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([ConversationSchema, MessageSchema]),
    CqrsModule,
  ],
  controllers: [],
  providers: [ConversationRepository],
  exports: [ConversationRepository]
})
export class ChatModule {}
