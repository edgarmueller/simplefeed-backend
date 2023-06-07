import { DomainEvents } from '@kittgen/shared-ddd'
import { User } from '@kittgen/user'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import {
  IPaginationOptions,
  Pagination,
  paginate,
} from 'nestjs-typeorm-paginate'
import { Repository } from 'typeorm'
import { Transactional } from 'typeorm-transactional'
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'
import { Comment } from './comment'
import { CommentNotFoundError } from './errors/comment-not-found.error'
import { PostNotFoundError } from './errors/post-not-found.error'
import { Like } from './like'
import { Post, PostId } from './post'

export const DEFAULT_COMMENTS_LIMIT = 10

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async savePost(post: Post): Promise<Post> {
    const savedPost = await this.postRepository.save(post)
    await this.likeRepository.save(post.likes)
    DomainEvents.dispatchEventsForAggregate(post.id, this.publisher)
    return savedPost
  }

  @Transactional()
  async saveComment(comment: Comment): Promise<Comment> {
    const savedComment = await this.commentRepository.save(comment)
    DomainEvents.dispatchEventsForAggregate(
      savedComment.post.id,
      this.publisher
    )
    return savedComment
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

  async findOneByIdAndUserIdOrFailWithLikes(postId: PostId, userId: string): Promise<Post> {
    try {
      const foundPost = await this.postRepository
        .createQueryBuilder('post')
        .where('post.id = :id', { id: postId })
        .leftJoinAndMapMany('post.likes', Like, 'likes', 'likes.user_id = :userId AND likes.post_id = post.id', {
          userId,
        })
        .getOneOrFail();
      return foundPost
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new PostNotFoundError()
      }
      throw error
    }
  }

  async findOneCommentByIdOrFail(commentId: string): Promise<Comment> {
    try {
      const foundComment = await this.commentRepository.findOneOrFail({
        where: { id: commentId },
      })
      return foundComment
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new CommentNotFoundError()
      }
      throw error
    }
  }

  async findComments(
    postId: string,
    commentId?: string,
    paginationOpts: IPaginationOptions = {
      page: 1,
      limit: DEFAULT_COMMENTS_LIMIT,
    }
  ): Promise<Pagination<Comment>> {
    try {
      const query = this.commentRepository
        .createQueryBuilder('comment')
        .select('comment')
        .innerJoinAndSelect(
          'comment.post',
          'post',
          'comment.post_id = :postId',
          { postId }
        )
        .innerJoinAndSelect(
          'comment.author',
          'user',
          'comment.author_id = user.id'
        )
        .leftJoinAndSelect(
          'user.profile',
          'profile',
          'profile.user_id = user.id'
        )
      query.where('comment.path LIKE :commentId', {
        commentId: `%${commentId || postId}%`,
      })
      query.orderBy('comment.path')
      return await paginate(query, paginationOpts)
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new CommentNotFoundError()
      }
      throw error
    }
  }
  async findUserActivityFeed(
    userId: string,
    paginationOpts: IPaginationOptions
  ): Promise<Pagination<Post>> {
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
    paginationOpts: IPaginationOptions
  ): Promise<Pagination<Post>> {
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

  findCommentsByPost(postId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { post: { id: postId } },
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
    const comments = await this.commentRepository.find({
      where: { post: { id: postId } },
    })
    await this.commentRepository.softRemove(comments)
    // we don't decrease total number of likes for users
    await this.postRepository.softRemove(post)
  }

  @Transactional()
  async deleteAll() {
    await this.likeRepository.delete({})
    await this.commentRepository.delete({})
    await this.postRepository.delete({})
  }
}
