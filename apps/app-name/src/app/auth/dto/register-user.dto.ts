import { Type } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator'

export class UserDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string
}

export class RegisterUserDto {
  @ValidateNested()
  @IsObject()
  @Type(() => UserDto)
  user: UserDto
}
