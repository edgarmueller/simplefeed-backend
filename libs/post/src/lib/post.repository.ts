import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@kittgen/shared-ddd'
import { Transactional } from 'typeorm-transactional'
import { In, Repository } from 'typeorm'
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'
import { InjectRepository } from '@nestjs/typeorm'
import { EventPublisher } from '@nestjs/cqrs'
import { PostNotFoundError } from './errors/post-not-found.error'
import { Post, PostId } from './post'
import { Comment } from './comment'
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate'
import { CommentNotFoundError } from './errors/comment-not-found.error'

export const DEFAULT_COMMENTS_LIMIT = 10;

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async savePost(post: Post): Promise<Post> {
    const savedPost = await this.postRepository.save(post)
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
    paginationOpts: IPaginationOptions = { page: 1, limit: DEFAULT_COMMENTS_LIMIT }
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
      if (commentId) {
        query.where('comment.path LIKE :commentId', {
          commentId: `%${commentId}%`,
        })
      } else {
        query.where('comment.path LIKE :postId', { postId })
      }
      query.orderBy('comment.createdAt', 'ASC')
      return await paginate(query, paginationOpts)
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new CommentNotFoundError()
      }
      throw error
    }
  }

  async findPostsByUsers(
    userIds: string[],
    paginationOpts: IPaginationOptions
  ): Promise<Pagination<Post>> {
    const posts = await paginate(this.postRepository, paginationOpts, {
      where: { author: { id: In(userIds) } },
      relations: {
        author: true,
        postedTo: true,
      },
    })
    return posts
  }

  findCommentsByPost(postId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { post: { id: postId } },
    })
  }
}
