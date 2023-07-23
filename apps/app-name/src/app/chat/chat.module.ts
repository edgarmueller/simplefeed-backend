import { AuthModule as AuthCoreModule } from "@simplefeed/auth";
import { ChatModule as ChatCoreModule } from "@simplefeed/chat";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthConfigFactory } from "../auth/auth.config.factory";
import { UserModule } from "../user/user.module";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./adapters/chat.gateway";
import { FriendRequestAcceptedEventHandler } from "./event-handlers/friend-request-accepted.event-handler";
import { MessagesGateway } from "./messages.gateway";
import { NotificationModule } from "@simplefeed/notification";

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