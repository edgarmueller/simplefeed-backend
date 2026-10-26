import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import { FeedUsecases } from '@simplefeed/feed'
import { AddFeedDto, GetFeedDto } from '../dto/feed.dto'

@Controller('feeds')
export class FeedsController {
  constructor(private readonly usecases: FeedUsecases) {}

  /**
   * Adds a feed by its URL or a website's. A known feed is subscribed to
   * right away (status "active"); a new one is "pending" until the channels
   * worker has read it.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async add(@Req() req: RequestWithUser, @Body() dto: AddFeedDto): Promise<GetFeedDto> {
    return GetFeedDto.fromDomain(await this.usecases.add(req.user, dto.url))
  }

  /** The feeds the user added that aren't channels yet. */
  @UseGuards(JwtAuthGuard)
  @Get()
  async mine(@Req() req: RequestWithUser): Promise<GetFeedDto[]> {
    const feeds = await this.usecases.requestedBy(req.user)
    return feeds.map(GetFeedDto.fromDomain)
  }

  /** Withdraws the user's request, e.g. to dismiss a feed that failed. */
  @UseGuards(JwtAuthGuard)
  @Delete(':feedId')
  @HttpCode(204)
  async withdraw(@Req() req: RequestWithUser, @Param('feedId') feedId: string): Promise<void> {
    await this.usecases.withdraw(req.user, feedId)
  }
}
