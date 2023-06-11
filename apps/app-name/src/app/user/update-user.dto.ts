import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsEmail()
	@IsOptional()
	email?: string;

  @IsString()
	@IsOptional()
	firstName?: string;

  @IsString()
	@IsOptional()
	lastName?: string;

  @IsString()
	@MinLength(8)
	@IsOptional()
	password?: string
}