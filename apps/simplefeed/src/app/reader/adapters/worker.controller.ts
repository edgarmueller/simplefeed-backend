import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ChannelStatus, WorkerUsecases } from '@simplefeed/reader'
import { WorkerKeyGuard } from '../../infra/worker-key.guard'
import {
  ActivateChannelDto,
  AnswerDto,
  ChannelDto,
  FailChannelDto,
  ItemDto,
  PicksDto,
  SinceQueryDto,
  StoreItemsDto,
  WorkerChannelsQueryDto,
} from '../dto/reader.dto'

const STATUSES: ChannelStatus[] = ['pending', 'active', 'failed']

/** What the channels worker needs, authenticated with WORKER_API_KEY. */
@UseGuards(WorkerKeyGuard)
@Controller('worker')
export class WorkerController {
  constructor(private readonly worker: WorkerUsecases) {}

  @Get('channels')
  async channels(@Query() query: WorkerChannelsQueryDto): Promise<ChannelDto[]> {
    const statuses = query.status.split(',').filter((s): s is ChannelStatus => STATUSES.includes(s as ChannelStatus))
    return (await this.worker.channels(statuses)).map((channel) => ChannelDto.fromDomain(channel))
  }

  @Post('channels/:channelId/activate')
  async activate(@Param('channelId') channelId: string, @Body() dto: ActivateChannelDto): Promise<ChannelDto> {
    return ChannelDto.fromDomain(await this.worker.activate(channelId, dto))
  }

  @Post('channels/:channelId/fail')
  async fail(@Param('channelId') channelId: string, @Body() dto: FailChannelDto): Promise<ChannelDto> {
    return ChannelDto.fromDomain(await this.worker.fail(channelId, dto.error))
  }

  /** Stores new items and refreshes known ones; returns them with their ids. */
  @Post('channels/:channelId/items')
  @HttpCode(200)
  async storeItems(@Param('channelId') channelId: string, @Body() dto: StoreItemsDto): Promise<ItemDto[]> {
    const items = await this.worker.storeItems(
      channelId,
      dto.items.map((item) => ({
        ...item,
        excerpt: item.excerpt ?? null,
        score: item.score ?? null,
        comments: item.comments ?? null,
        discussionUrl: item.discussionUrl ?? null,
        sourceName: item.sourceName ?? null,
      }))
    )
    return items.map(ItemDto.fromDomain)
  }

  /** The channel's subscribers with their preferences, picks since `since` and liked titles. */
  @Get('channels/:channelId/subscriptions')
  async subscriptions(@Param('channelId') channelId: string, @Query() query: SinceQueryDto) {
    return (await this.worker.subscriptionsOf(channelId, query.since)).map(toContext)
  }

  /** Subscriptions that haven't got anything yet, e.g. right after subscribing. */
  @Get('subscriptions/fresh')
  async fresh(@Query() query: SinceQueryDto) {
    return (await this.worker.freshSubscriptions(query.since)).map(toContext)
  }

  /** Items of the subscription's channel since `since` that weren't picked for its reader. */
  @Get('subscriptions/:subscriptionId/candidates')
  async candidates(@Param('subscriptionId') subscriptionId: string, @Query() query: SinceQueryDto): Promise<ItemDto[]> {
    return (await this.worker.candidates(subscriptionId, query.since)).map(ItemDto.fromDomain)
  }

  /** Adds picks to the reader's feed, best first. */
  @Post('subscriptions/:subscriptionId/picks')
  @HttpCode(204)
  async pick(@Param('subscriptionId') subscriptionId: string, @Body() dto: PicksDto): Promise<void> {
    await this.worker.pick(subscriptionId, dto.picks)
  }

  /** Readers' chat messages the channels haven't answered yet, with the preferences to tune. */
  @Get('messages/unanswered')
  async unanswered() {
    return (await this.worker.unansweredMessages()).map((message) => ({
      id: message.id,
      subscriptionId: message.subscription.id,
      channel: ChannelDto.fromDomain(message.subscription.channel),
      content: message.content,
      preferences: message.subscription.preferences,
      createdAt: message.createdAt,
    }))
  }

  @Post('messages/:messageId/answer')
  @HttpCode(204)
  async answer(@Param('messageId') messageId: string, @Body() dto: AnswerDto): Promise<void> {
    await this.worker.answer(messageId, dto.reply, dto.preferences)
  }
}

function toContext({ subscription, pickedSince, likedTitles }: Awaited<ReturnType<WorkerUsecases['subscriptionsOf']>>[number]) {
  return {
    id: subscription.id,
    channel: ChannelDto.fromDomain(subscription.channel),
    preferences: subscription.preferences,
    pickedSince,
    likedTitles,
  }
}
