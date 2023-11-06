import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class RequestMessagesDto {
	@IsString()
	@IsNotEmpty()
	conversationId: string

	@IsString()
	@IsNotEmpty()
	auth: string

	@IsNumber()
	@IsOptional()
	page = 0
}