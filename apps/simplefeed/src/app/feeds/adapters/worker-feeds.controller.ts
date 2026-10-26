import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { FeedStatus, FeedUsecases } from '@simplefeed/feed'
import { BotRegistrationGuard } from '../../auth/bot-registration.guard'
import { ActivateFeedDto, FailFeedDto, GetFeedDto } from '../dto/feed.dto'

const STATUSES: FeedStatus[] = ['pending', 'active', 'failed']

/** For the channels worker, which authenticates with BOT_REGISTRATION_KEY. */
@UseGuards(BotRegistrationGuard)
@Controller('worker/feeds')
export class WorkerFeedsController {
  constructor(private readonly usecases: FeedUsecases) {}

  /** Feeds by status, e.g. `?status=pending` or `?status=pending,active`. */
  @Get()
  async list(@Query('status') status = 'pending'): Promise<GetFeedDto[]> {
    const statuses = status.split(',').filter((s): s is FeedStatus => STATUSES.includes(s as FeedStatus))
    const feeds = await this.usecases.withStatus(statuses)
    return feeds.map(GetFeedDto.fromDomain)
  }

  @Post(':feedId/activate')
  async activate(@Param('feedId') feedId: string, @Body() dto: ActivateFeedDto): Promise<GetFeedDto> {
    const feed = await this.usecases.activate(feedId, dto.feedUrl, dto.title, dto.channelUsername)
    return GetFeedDto.fromDomain(feed)
  }

  @Post(':feedId/fail')
  async fail(@Param('feedId') feedId: string, @Body() dto: FailFeedDto): Promise<GetFeedDto> {
    return GetFeedDto.fromDomain(await this.usecases.fail(feedId, dto.error))
  }
}
