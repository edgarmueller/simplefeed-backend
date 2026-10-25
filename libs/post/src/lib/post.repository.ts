import { DomainEvents, Page, PageOptions, paginate } from '@simplefeed/shared-ddd'
import { User } from '@simplefeed/user'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Transactional } from 'typeorm-transactional'
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'
import { PostNotFoundError } from './errors/post-not-found.error'
import { Like } from './like'
import { Post, PostId } from './post'

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async savePost(post: Post): Promise<Post> {
    const savedPost = await this.postRepository.save(post)
    if (post.likes) {
      await this.likeRepository.save(post.likes)
    }
    DomainEvents.publishOnCommit(post, this.publisher)
    return savedPost
  }

  async findAll(): Promise<Post[]> {
    const posts = await this.postRepository.find()
    return posts
  }

  async findOneByIdWithAuthorOrFail(id: PostId): Promise<Post> {
    try {
      const foundPost = await this.postRepository.findOneOrFail({
        where: { id },
        relations: { author: true },
      })
      return foundPost
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new PostNotFoundError()
      }
      throw error
    }
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

  async findOneWithAuthorByIdAndLikedById(postId: PostId, userId: string): Promise<Post> {
    try {
      const foundPost = await this.postRepository
        .createQueryBuilder('post')
        .where('post.id = :id', { id: postId })
        .leftJoinAndMapMany('post.likes', Like, 'likes', 'likes.user_id = :userId AND likes.post_id = post.id', {
          userId,
        })
        .innerJoinAndSelect(
          'post.author',
          'user',
          'post.author_id = user.id'
        )
        .getOne();
      return foundPost
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new PostNotFoundError()
      }
      throw error
    }
  }

  async findUserActivityFeed(
    userId: string,
    paginationOpts: PageOptions
  ): Promise<Page<Post>> {
    const qb = this.postRepository.createQueryBuilder('post')
    qb.leftJoinAndSelect('post.author', 'author', 'post.author_id = author.id')
      .leftJoinAndSelect(
        'author.profile',
        'profile',
        'profile.user_id = author.id'
      )
      .innerJoinAndSelect('post.postedTo', 'postedTo')
      .leftJoinAndSelect(
        'postedTo.profile',
        'postedToProfile',
        'postedToProfile.user_id = postedTo.id'
      )
      .leftJoinAndMapMany('post.likes', Like, 'likes', 'likes.user_id = :userId AND likes.post_id = post.id', {
        userId,
      })
      .where('postedTo.id = :userId', { userId })
      .orWhere('author.id = :userId', { userId })
      .orderBy('post.createdAt', 'DESC')
    const posts = await paginate(qb, paginationOpts)
    return posts
  }

  async findPostsByUsers(
    userId: string,
    friendIds: string[],
    paginationOpts: PageOptions
  ): Promise<Page<Post>> {
    const qb = this.postRepository.createQueryBuilder('post')
    qb.innerJoinAndSelect(
      'post.author',
      'author',
      'author.id IN (:...friendIds)',
      { friendIds: [userId, ...friendIds] }
    )
      .leftJoinAndSelect(
        'author.profile',
        'profile',
        'profile.user_id = author.id'
      )
      .innerJoinAndSelect('post.postedTo', 'postedTo')
      .leftJoinAndSelect(
        'postedTo.profile',
        'postedToProfile',
        'postedToProfile.user_id = postedTo.id'
      )
      .leftJoinAndMapMany('post.likes', Like, 'likes', 'likes.user_id = :userId AND likes.post_id = post.id', {
        userId,
      })
      .orderBy('post.createdAt', 'DESC')
    const posts = await paginate(qb, paginationOpts)
    return posts
  }

  findLikedPostsByUser(id: string) {
    return this.likeRepository.find({
      where: { user: { id } },
    })
  }

  /** Active likes on the author's posts, most recent first. */
  findLikesOnPostsOf(authorId: string, limit: number): Promise<Like[]> {
    return this.likeRepository.find({
      where: { post: { author: { id: authorId } }, unliked: false },
      relations: { post: true },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  @Transactional()
  async delete(postId: string, user: User) {
    const post = await this.postRepository.findOneOrFail({
      where: { id: postId },
      relations: {
        author: true,
      },
    })
    if (post.author.id !== user.id) {
      throw new ForbiddenException('User is not allowed to delete this post')
    }
    // we don't decrease total number of likes for users
    await this.postRepository.softRemove(post)
  }

  @Transactional()
  async deleteAll() {
    await this.likeRepository.createQueryBuilder().delete().execute()
    await this.postRepository.createQueryBuilder().delete().execute()
  }
}
