import { IsNotEmpty, IsString } from "class-validator";

export class JoinConversationDto {
	@IsString()
	@IsNotEmpty()
	conversationId: string

	@IsString()
	@IsNotEmpty()
	auth: string
}