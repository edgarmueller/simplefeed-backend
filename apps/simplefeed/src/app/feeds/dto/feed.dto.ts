import { Feed } from '@simplefeed/feed'
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator'

export class AddFeedDto {
  /** a feed's URL, or a website that links to its feed */
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  url: string
}

export class ActivateFeedDto {
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'], require_tld: false })
  feedUrl: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string

  @IsString()
  @IsNotEmpty()
  channelUsername: string
}

export class FailFeedDto {
  @IsString()
  @IsNotEmpty()
  error: string
}

export class GetFeedDto {
  id: string
  url: string
  feedUrl?: string
  title?: string
  status: string
  error?: string
  /** when the feed was added */
  createdAt: Date
  /** the channel posting the feed, once it is active */
  channel?: { id: string; username: string; firstName: string; lastName: string }

  static fromDomain(feed: Feed): GetFeedDto {
    const channel = feed.channel
    return {
      id: feed.id,
      url: feed.url,
      feedUrl: feed.feedUrl ?? undefined,
      title: feed.title ?? undefined,
      status: feed.status,
      error: feed.error ?? undefined,
      createdAt: feed.createdAt,
      channel: channel
        ? {
            id: channel.id,
            username: channel.profile.username,
            firstName: channel.profile.firstName,
            lastName: channel.profile.lastName,
          }
        : undefined,
    }
  }
}
