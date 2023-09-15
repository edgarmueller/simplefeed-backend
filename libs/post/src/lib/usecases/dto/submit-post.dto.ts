import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { AttachmentType } from './../../post';

export class PostAttachmentDto {
	@IsEnum(AttachmentType)
	type: AttachmentType;

	@IsUrl()
	url: string;
}
export class SubmitPostDto {
	@IsNotEmpty()
	@IsString()
	body: string;

	@IsOptional()
	toUserId?: string;

	@IsArray()
	@Type(() => PostAttachmentDto)
	@IsOptional()
	attachments?: PostAttachmentDto[]; 
}