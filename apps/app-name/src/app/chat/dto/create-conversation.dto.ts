import { ArrayMaxSize, ArrayMinSize, ArrayNotEmpty, IsArray } from "class-validator";

export class CreateConversationDto {
	@IsArray()
	@ArrayNotEmpty()
	@ArrayMinSize(2)
	@ArrayMaxSize(2)
	participantIds: string[];
}