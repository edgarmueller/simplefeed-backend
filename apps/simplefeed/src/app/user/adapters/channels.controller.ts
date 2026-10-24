import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@simplefeed/auth'
import { UserUsecases } from '@simplefeed/user'
import { GetUserDto } from '../dto/get-user.dto'

@Controller('channels')
export class ChannelsController {
  constructor(private readonly usecases: UserUsecases) {}

  /** The automated accounts users can subscribe to. */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getChannels(): Promise<GetUserDto[]> {
    const channels = await this.usecases.getChannels()
    return channels.map((channel) => GetUserDto.fromDomain(channel))
  }
}
