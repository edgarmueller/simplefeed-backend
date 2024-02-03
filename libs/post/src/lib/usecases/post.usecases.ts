import { S3Service } from '@kittgen/s3';
import { last } from 'lodash';
import { User, UsersRepository } from '@simplefeed/user';
import { Injectable } from '@nestjs/common';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import 'multer';
import { Comment } from '../comment';
import { Attachment, AttachmentType, Post } from '../post';
import { PostsRepository } from '../post.repository';
import { DEFAULT_COMMENTS_LIMIT } from './../post.repository';
import { PostNotFoundError } from '../errors/post-not-found.error';

type File = Express.Multer.File;

@Injectable()
export class PostUsecases {
  constructor(
    readonly usersRepository: UsersRepository,
    readonly postsRepository: PostsRepository,
    readonly s3Service: S3Service,
  ) {}

  async submitPost(
    body: string,
    author: User,
    attachments?: Attachment[],
    files: File[] = [],
    toUserId?: string
  ): Promise<Post> {
    let postedTo: User | undefined
    if (toUserId) {
      try {
        postedTo = await this.usersRepository.findOneByIdOrFail(toUserId)
      } catch (error) {
        throw new Error('User not found')
      }
    }
    // TODO: error handling & do we wanna use event?
    const uploads = await Promise.all(files.map(file => 
      this.s3Service.uploadPublicFile(file.buffer, file.originalname)
    ))
    const post = Post.create({
      body,
      postedTo: postedTo,
      author: author,
      attachments: [
        ...attachments.filter(({ type }) => type !== AttachmentType.IMAGE),
        ...uploads.map(({ Location }) => ({
          type: AttachmentType.IMAGE,
          url: Location,
        }))
      ],
    })
    // TODO: use event?
    author.profile.incrementPostCount()
    await this.usersRepository.save(author)
    const savedPost = await this.postsRepository.savePost(post)
    return savedPost
  }

  async getUserActivityFeed(userId: string, paginationOpts: IPaginationOptions): Promise<Pagination<Post>> {
    const posts = await this.postsRepository.findUserActivityFeed(
      userId,
      paginationOpts
    )
    return {
      ...posts,
      items: posts.items
    }
  }

  async getPersonalFeed(
    userId: string,
    paginationOpts: IPaginationOptions
  ): Promise<Pagination<Post>> {
    const { friends: friends } = await this.usersRepository.findOneByIdWithFriendsOrFail(userId)
    const posts = await this.postsRepository.findPostsByUsers(
      userId,
      [userId, ...friends.map(friend => friend.id)],
      paginationOpts
    )
    return {
      ...posts,
      items: posts.items
    }
  }

  async getPost(postId: string, userId: string): Promise<Post> {
    const { friends } = await this.usersRepository.findOneByIdWithFriendsOrFail(userId)
    const friendIds = friends.map(friend => friend.id)
    const post = await this.postsRepository.findOneByIdWithAuthorOrFail(postId)
    if ([userId, ...friendIds].filter(friendId => friendId === userId).length === 0) {
      throw new PostNotFoundError()
    }
    
    return post
  }

  async findLikedPostsByUser(
    user: User,
  ) {
    return this.postsRepository.findLikedPostsByUser(user.id)
  }

  async postComment(
    user: User,
    postId: string,
    content: string,
    stringifiedPath?: string
  ): Promise<Comment> {
    const post = await this.postsRepository.findOneByIdWithAuthorOrFail(postId)
    const path = Comment.escapePath(stringifiedPath || postId)
    const parentId = last(path?.split('.'))
    let parentComment: Comment | undefined
    if (parentId !== postId) {
      parentComment = await this.postsRepository.findOneCommentByIdWithAuthor(parentId)
    }
    const comment = Comment.create({
      content,
      author: user,
      post,
      path,
      parentComment
    })
    return await this.postsRepository.saveComment(comment)
  }

  async fetchComments(
    postId: string,
    commentId?: string,
    paginationOpts: IPaginationOptions = { page: 1, limit: DEFAULT_COMMENTS_LIMIT }
  ): Promise<Pagination<Comment>> {
    const res = await this.postsRepository.findComments(
      postId,
      commentId,
      paginationOpts
    )
    return {
      ...res,
      items: res.items
    }
  }

  async likePost(postId: string, likedBy: User) {
    const post = await this.postsRepository.findOneWithAuthorByIdAndLikedById(postId, likedBy.id)
    post.like(likedBy)
    await this.usersRepository.save(likedBy)
    await this.postsRepository.savePost(post)
  }

  async unlikePost(postId: string, unlikedBy: User) {
    const post = await this.postsRepository.findOneWithAuthorByIdAndLikedById(postId, unlikedBy.id)
    post.unlike(unlikedBy)
    await this.postsRepository.savePost(post)
  }

  async deletePost(postId: string, user: User) {
    await this.postsRepository.delete(postId, user)
    user.profile.decrementPostCount()
    await this.usersRepository.save(user)
  }
}
