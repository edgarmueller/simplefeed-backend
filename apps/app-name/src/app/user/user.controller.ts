import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth'
import { GetMeDto, GetUserDto, UserNotFoundError, UserUsecases } from '@kittgen/user'
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import 'multer'
import { FileSizeValidationPipe } from '../infra/file-size-validation.pipe'
import { UpdateUserDto } from './update-user.dto'

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
      const friends = await this.usecases.getFriendsOfUser(username)
      return friends
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException()
      }
      throw error
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  @UseInterceptors(FileInterceptor('image'))
  async updateUser(
    @Req() req: RequestWithUser,
    @Body() body: UpdateUserDto,
    @UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File,
  ): Promise<GetMeDto> {
    return await this.usecases.updateUserInfo(req.user, body.email, body.password, file?.buffer, file?.originalname, {
      firstName: body.firstName,
      lastName: body.lastName
    }) 
  }
}
