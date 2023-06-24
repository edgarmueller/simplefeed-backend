import { AuthModule as AuthCoreModule } from "@kittgen/auth";
import { ChatModule as ChatCoreModule } from "@kittgen/chat";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthConfigFactory } from "../auth/auth.config.factory";
import { UserModule } from "../user/user.module";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatUsecases } from "./chat.usecases";
import { FriendRequestAcceptedEventHandler } from "./event-handlers/friend-request-accepted.event-handler";
import { MessagesGateway } from "./messages.gateway";
import { ChatController } from "./chat.controller";

@Module({
	imports: [
		ChatCoreModule,
		UserModule,
    AuthCoreModule.registerAsync({
      imports: [ConfigModule],
			useClass: AuthConfigFactory,
    }),
	], 
	controllers: [ChatController],
	providers: [ChatGateway, MessagesGateway, ChatService, ChatUsecases, FriendRequestAcceptedEventHandler],
	exports: []
})
export class ChatModule {

}