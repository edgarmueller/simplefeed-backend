import { Module } from '@nestjs/common'
import { UserModule } from '@kittgen/user'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConversationSchema } from './conversation.schema'
import { CqrsModule } from '@nestjs/cqrs'
import { MessageSchema } from './message.schema'

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([ConversationSchema, MessageSchema]),
    CqrsModule,
  ],
  controllers: [],
  providers: [],
  exports: []
})
export class ChatModule {}
