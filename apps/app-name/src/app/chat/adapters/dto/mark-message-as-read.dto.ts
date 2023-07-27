import { IsNotEmpty, IsString } from "class-validator";

export class MarkMessageAsReadDto {
	@IsString()
	@IsNotEmpty()
	conversationId: string
}