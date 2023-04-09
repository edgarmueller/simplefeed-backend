import { IsOptional, IsString } from "class-validator";

export class CommentPostDto {
	@IsString()
	content: string;

	@IsString()
	@IsOptional()
	path?: string;
}