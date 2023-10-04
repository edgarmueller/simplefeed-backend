import { AuthModule as AuthCoreModule, AuthConfigFactory } from "@simplefeed/auth";
import { ChatModule as ChatCoreModule } from "@simplefeed/chat";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "../user/user.module";
import { ChatController } from "./adapters/chat.controller";
import { ChatGateway } from "./adapters/chat.gateway";
import { MessagesGateway } from "./adapters/messages.gateway";
import { NotificationModule } from "@simplefeed/notification";
import { FriendRequestAcceptedEventHandler } from "./adapters/friend-request-accepted.event-handler";

@Module({
	imports: [
		ChatCoreModule,
		NotificationModule,
		UserModule,
    AuthCoreModule.registerAsync({
      imports: [ConfigModule],
			useClass: AuthConfigFactory,
    }),
	], 
	controllers: [ChatController],
	providers: [ChatGateway, MessagesGateway, FriendRequestAcceptedEventHandler],
	exports: []
})
export class ChatModule {

}