import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@kittgen/shared-ddd'
import { Transactional } from 'typeorm-transactional'
import { In, Repository } from 'typeorm'
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'
import { InjectRepository } from '@nestjs/typeorm'
import { EventPublisher } from '@nestjs/cqrs'
import { PostNotFoundError } from './errors/post-not-found.error'
import { Post, PostId } from './post'
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate'

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async save(post: Post): Promise<Post> {
    const savedPost = await this.postRepository.save(post)
    DomainEvents.dispatchEventsForAggregate(post.id, this.publisher)
    return savedPost
  }

  async findAll(): Promise<Post[]> {
    const posts = await this.postRepository.find()
    return posts
  }

  async findOneByIdOrFail(id: PostId): Promise<Post> {
    try {
      const foundPost = await this.postRepository.findOneOrFail({
        where: { id },
      })
      return foundPost
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new PostNotFoundError()
      }
      throw error
    }
  }

  async findPostsByUsers(userIds: string[], paginationOpts: IPaginationOptions): Promise<Pagination<Post>> {
    const posts = await paginate(this.postRepository, paginationOpts, {
      where: { author: { id: In(userIds) } },
      relations: {
        author: true,
        postedTo: true
      }
    })
    return posts
  }
}
