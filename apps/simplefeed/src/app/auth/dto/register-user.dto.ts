import { Type } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class UserDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  firstName: string

  @IsString()
  @IsNotEmpty()
  lastName: string

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string
}

/** Channels are named after a single title, so they need no last name. */
export class BotDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  firstName: string

  @IsString()
  @IsOptional()
  lastName?: string

  @IsString()
  @IsOptional()
  imageUrl?: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string

  @IsString()
  @IsOptional()
  bio?: string
}

export class RegisterBotDto {
  @ValidateNested()
  @IsObject()
  @Type(() => BotDto)
  user: BotDto
}

export class RegisterUserDto {
  @ValidateNested()
  @IsObject()
  @Type(() => UserDto)
  user: UserDto
}
