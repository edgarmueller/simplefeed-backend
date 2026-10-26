import { Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { DomainEvents } from '@simplefeed/shared-ddd'
import { In, Repository } from 'typeorm'
import { Transactional } from 'typeorm-transactional'
import { Feed, FeedStatus } from './feed'

const RELATIONS = { channel: { profile: true }, requesters: { profile: true } }

@Injectable()
export class FeedRepository {
  constructor(
    @InjectRepository(Feed) private readonly feedRepository: Repository<Feed>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async save(feed: Feed): Promise<Feed> {
    const saved = await this.feedRepository.save(feed)
    DomainEvents.publishOnCommit(feed, this.publisher)
    return saved
  }

  async delete(feed: Feed): Promise<void> {
    await this.feedRepository.remove(feed)
  }

  /** The feed added at `url`, or whose feed was found at it. */
  findByUrl(url: string): Promise<Feed | null> {
    return this.feedRepository.findOne({ where: [{ url }, { feedUrl: url }], relations: RELATIONS })
  }

  findActiveByFeedUrl(feedUrl: string): Promise<Feed | null> {
    return this.feedRepository.findOne({ where: { feedUrl, status: 'active' }, relations: RELATIONS })
  }

  findOneByIdOrFail(id: string): Promise<Feed> {
    return this.feedRepository.findOneOrFail({ where: { id }, relations: RELATIONS })
  }

  findByStatus(statuses: FeedStatus[]): Promise<Feed[]> {
    return this.feedRepository.find({
      where: { status: In(statuses) },
      relations: RELATIONS,
      order: { createdAt: 'ASC' },
    })
  }

  /** Feeds the user asked for that aren't channels yet. */
  findRequestedBy(userId: string): Promise<Feed[]> {
    return this.feedRepository.find({
      where: { requesters: { id: userId } },
      relations: RELATIONS,
      order: { createdAt: 'DESC' },
    })
  }

  async deleteAll() {
    await this.feedRepository.createQueryBuilder().delete().execute()
  }
}
