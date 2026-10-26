import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import { ChannelUsecases, FeedUsecases } from '@simplefeed/reader'
import { AddFeedDto, ChannelDto, SubscriptionDto } from '../dto/reader.dto'

@UseGuards(JwtAuthGuard)
@Controller()
export class ChannelsController {
  constructor(
    private readonly channels: ChannelUsecases,
    private readonly feed: FeedUsecases
  ) {}

  /** The channels anyone can subscribe to, with whether the reader does. */
  @Get('channels')
  async catalog(@Req() req: RequestWithUser): Promise<ChannelDto[]> {
    const [channels, subscriptions] = await Promise.all([
      this.channels.catalog(),
      this.channels.subscriptionsOf(req.user.id),
    ])
    const subscribed = new Set(subscriptions.map((subscription) => subscription.channel.id))
    return channels.map((channel) => ChannelDto.fromDomain(channel, subscribed.has(channel.id)))
  }

  /**
   * Adds a feed by its URL or a website's and subscribes to it. A known feed
   * is subscribed to as is; a new one is pending until the worker read it.
   */
  @Post('channels')
  async addFeed(@Req() req: RequestWithUser, @Body() dto: AddFeedDto): Promise<SubscriptionDto> {
    return SubscriptionDto.fromDomain(await this.channels.addFeed(req.user.id, dto.url))
  }

  /** Subscribes right away; subscribing twice is fine. */
  @Put('channels/:channelId/subscription')
  async subscribe(@Req() req: RequestWithUser, @Param('channelId') channelId: string): Promise<SubscriptionDto> {
    return SubscriptionDto.fromDomain(await this.channels.subscribe(req.user.id, channelId))
  }

  @Delete('channels/:channelId/subscription')
  @HttpCode(204)
  async unsubscribe(@Req() req: RequestWithUser, @Param('channelId') channelId: string): Promise<void> {
    await this.channels.unsubscribe(req.user.id, channelId)
  }

  /**
   * The reader's subscriptions with their unread counts and when they last
   * got something, including feeds being read or that failed.
   */
  @Get('subscriptions')
  async subscriptions(@Req() req: RequestWithUser): Promise<SubscriptionDto[]> {
    const [subscriptions, stats] = await Promise.all([
      this.channels.subscriptionsOf(req.user.id),
      this.feed.stats(req.user.id),
    ])
    return subscriptions.map((subscription) => SubscriptionDto.fromDomain(subscription, stats[subscription.channel.id]))
  }
}
