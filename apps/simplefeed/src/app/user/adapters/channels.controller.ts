import { Controller, Delete, Get, HttpCode, Param, Put, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import { SubscriptionUsecases, UserUsecases } from '@simplefeed/user'
import { GetUserDto } from '../dto/get-user.dto'

@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly usecases: UserUsecases,
    private readonly subscriptions: SubscriptionUsecases
  ) {}

  /** The channels users can subscribe to, with whether the requesting user does. */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getChannels(@Req() req: RequestWithUser): Promise<GetUserDto[]> {
    const [channels, me] = await Promise.all([this.usecases.getChannels(), this.usecases.getMe(req.user)])
    return channels.map((channel) => GetUserDto.fromDomain(channel, me.isFriend(channel)))
  }

  /** Subscribes the requesting user, effective immediately. Subscribing twice is fine. */
  @UseGuards(JwtAuthGuard)
  @Put(':username/subscription')
  async subscribe(@Req() req: RequestWithUser, @Param('username') username: string): Promise<GetUserDto> {
    const channel = await this.subscriptions.subscribe(req.user, username)
    return GetUserDto.fromDomain(channel, true)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':username/subscription')
  @HttpCode(204)
  async unsubscribe(@Req() req: RequestWithUser, @Param('username') username: string): Promise<void> {
    await this.subscriptions.unsubscribe(req.user, username)
  }
}
