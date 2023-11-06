import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { AttachmentType } from '@simplefeed/post';

export class PostAttachmentDto {
	@IsEnum(AttachmentType)
	type: AttachmentType;

	@IsUrl()
	url: string;

	@IsString()
	@IsOptional()
	image: string
}
export class SubmitPostDto {
	@IsNotEmpty()
	@IsString()
	body: string;

	@IsOptional()
	toUserId?: string;

	@IsString()
	@IsOptional()
	attachments?: string 
}