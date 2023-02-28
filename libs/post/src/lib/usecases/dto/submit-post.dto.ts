import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SubmitPostDto {
	@IsNotEmpty()
	@IsString()
	body: string;

	@IsOptional()
	toUserId?: string;
}