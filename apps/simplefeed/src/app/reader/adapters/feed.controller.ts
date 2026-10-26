import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth'
import { FeedUsecases } from '@simplefeed/reader'
import { Page, mapPage } from '@simplefeed/shared-ddd'
import { EntryDto, FeedQueryDto, MarkAllReadDto, MarkEntryDto } from '../dto/reader.dto'

@UseGuards(JwtAuthGuard)
@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedUsecases) {}

  /** What the reader's channels picked for them, newest first: unread (the default), all, or saved. */
  @Get()
  async entries(@Req() req: RequestWithUser, @Query() query: FeedQueryDto): Promise<Page<EntryDto>> {
    const page = await this.feed.feed(
      req.user.id,
      { channelId: query.channel, unread: query.show === 'unread', saved: query.show === 'saved' },
      { page: query.page, limit: query.limit }
    )
    return mapPage(page, EntryDto.fromDomain)
  }

  /** Marks an entry read or unread, liked or saved. Likes tell its channel what the reader wants more of. */
  @Patch(':entryId')
  async mark(@Req() req: RequestWithUser, @Param('entryId') entryId: string, @Body() dto: MarkEntryDto): Promise<EntryDto> {
    const entry = await this.feed.mark(req.user.id, entryId, dto)
    return EntryDto.fromDomain(entry)
  }

  /** Marks the whole feed read, or one channel's part of it. */
  @Post('read')
  @HttpCode(200)
  async markAllRead(@Req() req: RequestWithUser, @Body() dto: MarkAllReadDto): Promise<{ marked: number }> {
    return { marked: await this.feed.markAllRead(req.user.id, dto.channelId) }
  }
}
