import { AuthModule as AuthCoreModule } from "@kittgen/auth";
import { ChatModule as ChatCoreModule } from "@kittgen/chat";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthConfigFactory } from "../auth/auth.config.factory";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";

@Module({
	imports: [
		ChatCoreModule,
    AuthCoreModule.registerAsync({
      imports: [ConfigModule],
			useClass: AuthConfigFactory,
    }),
	], 
	controllers: [],
	providers: [ChatGateway, ChatService],
	exports: []
})
export class ChatModule {

}