import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth'
import { UserNotFoundError } from '@kittgen/user'
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  UseGuards
} from '@nestjs/common'
import { UserUsecases } from './user.usecases'

@Controller()
export class UserController {
  constructor(private readonly usecases: UserUsecases) {}

  //@UseGuards(PublicGuard)
  @UseGuards(JwtAuthGuard)
  @Get('profiles/:username')
  async getProfile(
    @Param('username') username: string,
    @Req() req: RequestWithUser
  ): Promise<{ profile: any, friends: any }> {
    // const requestingUser = req.user
    try {
      const user = await this.usecases.getUserByUserName(username)
      return {
        profile: user.profile, //GetProfileDto.forUser(requestingUser).fromDomain(user)
        friends: user.friends 
      }
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException()
      }
      throw error
    }
  }
}