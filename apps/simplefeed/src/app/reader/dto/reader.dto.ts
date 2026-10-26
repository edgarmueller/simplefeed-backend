import { Channel, Entry, FeedStats, Item, Subscription, TuningMessage } from '@simplefeed/reader'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import { PaginatedQueryDto } from '../../infra/paginated-query.dto'

export class ChannelDto {
  id: string
  kind: string
  name?: string
  description?: string
  /** for feeds: the address as added */
  url?: string
  feedUrl?: string
  siteUrl?: string
  status: string
  error?: string
  subscribed?: boolean

  static fromDomain(channel: Channel, subscribed?: boolean): ChannelDto {
    return {
      id: channel.id,
      kind: channel.kind,
      name: channel.name ?? undefined,
      description: channel.description ?? undefined,
      url: channel.url ?? undefined,
      feedUrl: channel.feedUrl ?? undefined,
      siteUrl: channel.siteUrl ?? undefined,
      status: channel.status,
      error: channel.error ?? undefined,
      subscribed,
    }
  }
}

export class SubscriptionDto {
  id: string
  channel: ChannelDto
  preferences: object
  unread: number
  /** when the channel last picked something for the reader */
  lastPickedAt?: Date
  createdAt: Date

  static fromDomain(subscription: Subscription, stats?: FeedStats): SubscriptionDto {
    return {
      id: subscription.id,
      channel: ChannelDto.fromDomain(subscription.channel, true),
      preferences: subscription.preferences,
      unread: stats?.unread ?? 0,
      lastPickedAt: stats?.lastPickedAt,
      createdAt: subscription.createdAt,
    }
  }
}

export class ItemDto {
  id: string
  title: string
  url: string
  domain: string
  excerpt?: string
  score?: number
  comments?: number
  discussionUrl?: string
  sourceName?: string
  publishedAt: Date

  static fromDomain(item: Item): ItemDto {
    return {
      id: item.id,
      title: item.title,
      url: item.url,
      domain: item.domain,
      excerpt: item.excerpt ?? undefined,
      score: item.score ?? undefined,
      comments: item.comments ?? undefined,
      discussionUrl: item.discussionUrl ?? undefined,
      sourceName: item.sourceName ?? undefined,
      publishedAt: item.publishedAt,
    }
  }
}

export class EntryDto {
  id: string
  item: ItemDto
  channel: { id: string; kind: string; name?: string }
  summary?: string
  pickedAt: Date
  readAt?: Date
  likedAt?: Date
  savedAt?: Date

  static fromDomain(entry: Entry): EntryDto {
    const channel = entry.subscription.channel
    return {
      id: entry.id,
      item: ItemDto.fromDomain(entry.item),
      channel: { id: channel.id, kind: channel.kind, name: channel.name ?? undefined },
      summary: entry.summary ?? undefined,
      pickedAt: entry.pickedAt,
      readAt: entry.readAt ?? undefined,
      likedAt: entry.likedAt ?? undefined,
      savedAt: entry.savedAt ?? undefined,
    }
  }
}

export class MessageDto {
  id: string
  author: string
  content: string
  createdAt: Date

  static fromDomain(message: TuningMessage): MessageDto {
    return { id: message.id, author: message.author, content: message.content, createdAt: message.createdAt }
  }
}

// requests from readers

export class AddFeedDto {
  /** a feed's URL, or a website that links to its feed */
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  url: string
}

export class FeedQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsString()
  channel?: string

  /** "unread" (the default), "all" or "saved" */
  @IsOptional()
  @IsIn(['unread', 'all', 'saved'])
  show: 'unread' | 'all' | 'saved' = 'unread'
}

export class MarkEntryDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean

  @IsOptional()
  @IsBoolean()
  liked?: boolean

  @IsOptional()
  @IsBoolean()
  saved?: boolean
}

export class MarkAllReadDto {
  @IsOptional()
  @IsString()
  channelId?: string
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string
}

// requests from the worker

export class WorkerChannelsQueryDto {
  /** e.g. "pending" or "pending,active" */
  @IsOptional()
  @IsString()
  status = 'active'
}

export class ActivateChannelDto {
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'], require_tld: false })
  feedUrl: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  siteUrl?: string
}

export class FailChannelDto {
  @IsString()
  @IsNotEmpty()
  error: string
}

export class ItemInputDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  externalId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  title: string

  @IsUrl({ require_protocol: true, protocols: ['http', 'https'], require_tld: false })
  url: string

  @IsString()
  @IsNotEmpty()
  domain: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  excerpt?: string

  @IsOptional()
  @IsInt()
  score?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  comments?: number

  @IsOptional()
  @IsString()
  discussionUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceName?: string

  @Type(() => Date)
  @IsDate()
  publishedAt: Date
}

export class StoreItemsDto {
  @ValidateNested({ each: true })
  @ArrayMaxSize(200)
  @Type(() => ItemInputDto)
  items: ItemInputDto[]
}

export class SinceQueryDto {
  /** e.g. the start of the reader's day, to count today's picks */
  @Type(() => Date)
  @IsDate()
  since: Date
}

export class PickDto {
  @IsString()
  @IsNotEmpty()
  itemId: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  summary?: string
}

export class PicksDto {
  @ValidateNested({ each: true })
  @ArrayMaxSize(50)
  @Type(() => PickDto)
  picks: PickDto[]
}

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  reply: string

  /** the reader's preferences after the change; normalized on storing */
  @IsOptional()
  preferences?: object
}
