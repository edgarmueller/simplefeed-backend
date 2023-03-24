import { IsString } from "class-validator";

export class CommentPostDto {
	@IsString()
	content: string;

	@IsString()
	path: string;
}