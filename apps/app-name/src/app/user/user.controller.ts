import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth'
import { UserNotFoundError } from '@kittgen/user'
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common'
import { UserUsecases } from './user.usecases'
import { GetUserDto } from '../auth/dto/get-user.dto'
import { GetMeDto } from '../auth/dto/get-me.dto'

@Controller('users')
export class UserController {
  constructor(
    private readonly usecases: UserUsecases,
    ) {}

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
}
