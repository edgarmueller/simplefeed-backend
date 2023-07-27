import { Type } from "class-transformer";
import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class MessageDto {
	@IsString()
	@IsNotEmpty()
	conversationId: string

	@IsString()
	@IsNotEmpty()
	content: string

	@IsString()
	@IsNotEmpty()
	authorId: string
}

export class AuthDto {
	@IsNotEmpty()
	Authorization: string
}

export class SendMessageDto {
	@IsObject()
	@Type(() => MessageDto)
	message: MessageDto

	@IsObject()
	@Type(() => AuthDto)
	auth: AuthDto
}