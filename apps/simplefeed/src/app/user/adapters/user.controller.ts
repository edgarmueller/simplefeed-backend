import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import 'multer'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import { UserUsecases } from '@simplefeed/user'
import { FileSizeValidationPipe } from '../../infra/file-size-validation.pipe'
import { GetMeDto } from '../dto/get-me.dto'
import { GetUserDto } from '../dto/get-user.dto'
import { UpdateUserDto } from '../dto/update-user.dto'

type File = Express.Multer.File
@Controller('users')
export class UserController {
  constructor(private readonly usecases: UserUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: RequestWithUser): Promise<GetMeDto> {
    return GetMeDto.fromDomain(await this.usecases.getMe(request.user))
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username')
  async getUser(
    @Param('username') username: string,
    @Req() req: RequestWithUser
  ): Promise<GetMeDto | GetUserDto> {
    const user = await this.usecases.getUserByUserName(req.user, username)
    if (req.user.profile.username === username) {
      return GetMeDto.fromDomain(user)
    }
    const mutualFriends = await this.usecases.getMutualFriends(req.user, user)
    return GetUserDto.fromDomain(user).withMutualFriends(mutualFriends.length)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':userId')
  @UseInterceptors(FileInterceptor('image'))
  async updateUser(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserDto,
    @UploadedFile(new FileSizeValidationPipe()) file?: File
  ): Promise<GetMeDto> {
    const me = await this.usecases.updateUserInfo(
      req.user.id,
      dto.email,
      dto.password,
      {
        imageBuffer: file?.buffer,
        filename: file?.originalname,
      },
      dto.firstName,
      dto.lastName
    )
    return GetMeDto.fromDomain(me)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async closeAccount(@Req() req: RequestWithUser): Promise<void> {
    await this.usecases.closeAccount(req.user)
  }
}
