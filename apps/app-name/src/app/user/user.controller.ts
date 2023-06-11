import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth'
import { UserNotFoundError } from '@kittgen/user'
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import 'multer'
import { GetMeDto } from '../auth/dto/get-me.dto'
import { GetUserDto } from '../auth/dto/get-user.dto'
import { UpdateUserDto } from './update-user.dto'
import { UserUsecases } from './user.usecases'

@Controller('users')
export class UserController {
  constructor(private readonly usecases: UserUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: RequestWithUser): Promise<GetMeDto> {
    return this.usecases.getMe(request.user)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username')
  async getUser(
    @Param('username') username: string,
    @Req() req: RequestWithUser
  ): Promise<GetMeDto | GetUserDto> {
    try {
      return await this.usecases.getUserByUserName(req.user, username)
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException()
      }
      throw error
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username/friends')
  async getFriends(
    @Param('username') username: string,
    @Req() req: RequestWithUser
  ): Promise<GetUserDto[]> {
    try {
      return await this.usecases.getFriendsOfUser(username)
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException()
      }
      throw error
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @Req() req: RequestWithUser,
    @Body() body: UpdateUserDto,
    @UploadedFile(/*new FileSizeValidationPipe()*/) file: Express.Multer.File,
  ): Promise<GetMeDto> {
    this.usecases.updateUserInfo(req.user, body.email, body.password, {
      firstName: body.firstName,
      lastName: body.lastName
    }) 
    const user = await this.usecases.updateAvatar(file.buffer, req.user)
    return GetMeDto.fromDomain(user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(/*new FileSizeValidationPipe()*/) file: Express.Multer.File,
    @Req() req: RequestWithUser
  ): Promise<GetMeDto> {
    console.log({ file })
    const user = await this.usecases.updateAvatar(file.buffer, req.user)
    return GetMeDto.fromDomain(user)
  }
}
