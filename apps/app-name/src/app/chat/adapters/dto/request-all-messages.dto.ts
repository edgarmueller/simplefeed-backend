import { IsNotEmpty, IsString } from "class-validator";

export class RequestAllMessagesDto {
	@IsString()
	@IsNotEmpty()
	conversationId: string
}