import { User, UsersRepository } from '@kittgen/user';
import { Injectable } from '@nestjs/common';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { Comment } from '../comment';
import { Post } from '../post';
import { PostsRepository } from '../post.repository';
import { DEFAULT_COMMENTS_LIMIT } from './../post.repository';
import { CommentPostDto } from './dto/comment-post.dto';
import { GetCommentDto } from './dto/get-comment.dto';

@Injectable()
export class PostUsecases {
  constructor(
    readonly usersRepository: UsersRepository,
    readonly postsRepository: PostsRepository
  ) {}

  async submitPost(
    body: string,
    author: User,
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
    const post = Post.create({
      body,
      postedTo: postedTo,
      author: author,
    })
    author.profile.incrementPostCount()
    await this.usersRepository.save(author)
    return await this.postsRepository.savePost(post)
  }

  async findPosts(userId: string, paginationOpts: IPaginationOptions): Promise<Pagination<Post>> {
    const posts = await this.postsRepository.findPostsByUsers(
      userId,
      [],
      paginationOpts
    )
    console.log('findPosts', posts)
    return posts
  }

  async getFeed(
    userId: string,
    paginationOpts: IPaginationOptions
  ): Promise<Pagination<Post>> {
    const { friends: friends } = await this.usersRepository.findOneByIdWithFriendsOrFail(userId)
    const posts = await this.postsRepository.findPostsByUsers(
      userId,
      [userId, ...friends.map(friend => friend.id)],
      paginationOpts
    )
    return posts
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
    const post = await this.postsRepository.findOneByIdOrFail(postId)
    const path = dto.path || postId
    const comment = Comment.create({
      content: dto.content,
      author: user,
      post,
      path: path.endsWith('/') ? path.substring(0, path.length - 1) : path
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


  async fetchRootComments(
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
    const post = await this.postsRepository.findOneByIdOrFail(postId)
    post.like(likedBy)
    await this.postsRepository.savePost(post)
  }

  async unlikePost(postId: string, likedBy: User) {
    const post = await this.postsRepository.findOneByIdOrFailWithLikes(postId)
    post.unlike(likedBy)
    await this.postsRepository.savePost(post)
  }
}
