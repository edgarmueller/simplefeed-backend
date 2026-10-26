import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import { TuningUsecases } from '@simplefeed/reader'
import { MessageDto, SendMessageDto } from '../dto/reader.dto'

/** The reader's chat with a channel; the worker answers within seconds. */
@UseGuards(JwtAuthGuard)
@Controller('subscriptions/:subscriptionId/messages')
export class TuningController {
  constructor(private readonly tuning: TuningUsecases) {}

  @Get()
  async messages(@Req() req: RequestWithUser, @Param('subscriptionId') subscriptionId: string): Promise<MessageDto[]> {
    const messages = await this.tuning.messages(req.user.id, subscriptionId)
    return messages.map(MessageDto.fromDomain)
  }

  @Post()
  async send(
    @Req() req: RequestWithUser,
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: SendMessageDto
  ): Promise<MessageDto> {
    return MessageDto.fromDomain(await this.tuning.send(req.user.id, subscriptionId, dto.content))
  }
}
