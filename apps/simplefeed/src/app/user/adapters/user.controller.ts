import {
  Body,
  Controller, Delete, Get,
  NotFoundException,
  Param,
  Patch, Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth';
import { GetMeDto, GetUserDto, UserNotFoundError, UserUsecases } from '@simplefeed/user';
import { FileSizeValidationPipe } from '../../infra/file-size-validation.pipe';
import { UpdateUserDto } from './update-user.dto';

type File = Express.Multer.File
@Controller('users')
export class UserController {
  constructor(private readonly usecases: UserUsecases) { }

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
  @Patch(':userId')
  @UseInterceptors(FileInterceptor('image'))
  async updateUser(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserDto,
    @UploadedFile(new FileSizeValidationPipe()) file?: File,
  ): Promise<GetMeDto> {
    return await this.usecases.updateUserInfo(req.user.id, {
      email: dto.email,
      password: dto.password,
      imageBuffer: file?.buffer,
      filename: file?.originalname,
      firstName: dto.firstName,
      lastName: dto.lastName
    })
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async closeAccount(@Req() req: RequestWithUser): Promise<void> {
    await this.usecases.closeAccount(req.user)
  }
}
