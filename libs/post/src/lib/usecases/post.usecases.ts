import { last } from 'lodash';
import { User, UsersRepository } from '@simplefeed/user';
import { Injectable } from '@nestjs/common';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Comment } from '../comment';
import { Attachment, Post } from '../post';
import { PostsRepository } from '../post.repository';
import { DEFAULT_COMMENTS_LIMIT } from './../post.repository';
import { CommentPostDto } from './dto/comment-post.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { GetPostDto } from './dto/get-post.dto';
import { PostNotFoundError } from '../errors/post-not-found.error';

@Injectable()
export class PostUsecases {
  constructor(
    readonly usersRepository: UsersRepository,
    readonly postsRepository: PostsRepository
  ) {}

  async submitPost(
    body: string,
    author: User,
    attachments?: Attachment[],
    toUserId?: string
  ): Promise<GetPostDto> {
    let postedTo: User | undefined
    if (toUserId) {
      try {
        postedTo = await this.usersRepository.findOneByIdOrFail(toUserId)
      } catch (error) {
        throw new Error('User not found')
      }
    }
    const post = Post.create({
      body,
      postedTo: postedTo,
      author: author,
      attachments,
    })
    author.profile.incrementPostCount()
    await this.usersRepository.save(author)
    const savedPost = await this.postsRepository.savePost(post)
    return GetPostDto.fromDomain(savedPost);
  }

  async getUserActivityFeed(userId: string, paginationOpts: IPaginationOptions): Promise<Pagination<GetPostDto>> {
    const posts = await this.postsRepository.findUserActivityFeed(
      userId,
      paginationOpts
    )
    return {
      ...posts,
      items: posts.items.map(GetPostDto.fromDomain),
    }
  }

  async getPersonalFeed(
    userId: string,
    paginationOpts: IPaginationOptions
  ): Promise<Pagination<GetPostDto>> {
    const { friends: friends } = await this.usersRepository.findOneByIdWithFriendsOrFail(userId)
    const posts = await this.postsRepository.findPostsByUsers(
      userId,
      [userId, ...friends.map(friend => friend.id)],
      paginationOpts
    )
    return {
      ...posts,
      items: posts.items.map(GetPostDto.fromDomain),
    }
  }

  async getPost(postId: string, userId: string): Promise<GetPostDto> {
    const { friends } = await this.usersRepository.findOneByIdWithFriendsOrFail(userId)
    const friendIds = friends.map(friend => friend.id)
    const post = await this.postsRepository.findOneByIdWithAuthorOrFail(postId)
    if ([userId, ...friendIds].filter(friendId => friendId === userId).length === 0) {
      throw new PostNotFoundError()
    }
    
    return GetPostDto.fromDomain(post)
  }

  async findLikedPostsByUser(
    user: User,
  ) {
    return this.postsRepository.findLikedPostsByUser(user.id)
  }

  async postComment(
    user: User,
    postId: string,
    dto: CommentPostDto
  ): Promise<Comment> {
    const post = await this.postsRepository.findOneByIdWithAuthorOrFail(postId)
    const path = dto.path || postId
    const parentId = last(dto.path?.split('/'))
    let parentComment: Comment | undefined
    if (parentId !== postId) {
      parentComment = await this.postsRepository.findOneCommentByIdWithAuthor(parentId)
    }
    const comment = Comment.create({
      content: dto.content,
      author: user,
      post,
      path: path.endsWith('/') ? path.substring(0, path.length - 1) : path,
      parentComment
    })
    return await this.postsRepository.saveComment(comment)
  }

  async fetchComments(
    postId: string,
    commentId?: string,
    paginationOpts: IPaginationOptions = { page: 1, limit: DEFAULT_COMMENTS_LIMIT }
  ): Promise<Pagination<GetCommentDto>> {
    const res = await this.postsRepository.findComments(
      postId,
      commentId,
      paginationOpts
    )
    return {
      ...res,
      items: res.items.map(GetCommentDto.fromDomain),
    }
  }

  async likePost(postId: string, likedBy: User) {
    const post = await this.postsRepository.findOneWithAuthorByIdAndLikedById(postId, likedBy.id)
    post.like(likedBy)
    await this.postsRepository.savePost(post)
  }

  async unlikePost(postId: string, likedBy: User) {
    const post = await this.postsRepository.findOneWithAuthorByIdAndLikedById(postId, likedBy.id)
    post.unlike(likedBy)
    await this.postsRepository.savePost(post)
  }

  async deletePost(postId: string, user: User) {
    await this.postsRepository.delete(postId, user)
    user.profile.decrementPostCount()
    await this.usersRepository.save(user)
  }
}
