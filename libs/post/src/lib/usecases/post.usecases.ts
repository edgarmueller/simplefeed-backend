import { S3Service } from '@simplefeed/s3'
import { User, UsersRepository } from '@simplefeed/user'
import { Injectable } from '@nestjs/common'
import { Page, PageOptions } from '@simplefeed/shared-ddd'
import 'multer'
import { Attachment, AttachmentType, Post } from '../post'
import { PostsRepository } from '../post.repository'
import { PostNotFoundError } from '../errors/post-not-found.error'

type File = Express.Multer.File

@Injectable()
export class PostUsecases {
  constructor(
    readonly usersRepository: UsersRepository,
    readonly postsRepository: PostsRepository,
    readonly s3Service: S3Service
  ) {}

  async submitPost(
    body: string,
    author: User,
    attachments?: Attachment[],
    files: File[] = [],
    toUserId?: string
  ): Promise<Post> {
    // without a target, a post goes to the author's own feed; the feed
    // queries only show posts that have one
    const postedTo = toUserId
      ? await this.usersRepository.findOneByIdOrFail(toUserId)
      : author
    const imageUrls = await Promise.all(
      files.map((file) =>
        this.s3Service.uploadPublicFile(file.buffer, file.originalname)
      )
    )
    const post = Post.create({
      body,
      postedTo: postedTo,
      author: author,
      attachments: [
        ...attachments.filter(({ type }) => type !== AttachmentType.IMAGE),
        ...imageUrls.filter(Boolean).map((url) => ({
          type: AttachmentType.IMAGE,
          url,
        })),
      ],
    })
    // TODO: use event?
    author.profile.incrementPostCount()
    await this.usersRepository.save(author)
    const savedPost = await this.postsRepository.savePost(post)
    return savedPost
  }

  async getUserActivityFeed(
    userId: string,
    paginationOpts: PageOptions
  ): Promise<Page<Post>> {
    return this.postsRepository.findUserActivityFeed(userId, paginationOpts)
  }

  async getPersonalFeed(
    userId: string,
    paginationOpts: PageOptions
  ): Promise<Page<Post>> {
    const { friends: friends } =
      await this.usersRepository.findOneByIdWithFriendsOrFail(userId)
    return this.postsRepository.findPostsByUsers(
      userId,
      [userId, ...friends.map((friend) => friend.id)],
      paginationOpts
    )
  }

  async getPost(postId: string, userId: string): Promise<Post> {
    const { friends } = await this.usersRepository.findOneByIdWithFriendsOrFail(
      userId
    )
    const friendIds = friends.map((friend) => friend.id)
    const post = await this.postsRepository.findOneByIdWithAuthorOrFail(postId)
    if (
      [userId, ...friendIds].filter((friendId) => friendId === userId)
        .length === 0
    ) {
      throw new PostNotFoundError()
    }

    return post
  }

  async findLikedPostsByUser(user: User) {
    return this.postsRepository.findLikedPostsByUser(user.id)
  }

  async likePost(postId: string, likedBy: User) {
    const post = await this.postsRepository.findOneWithAuthorByIdAndLikedById(
      postId,
      likedBy.id
    )
    post.like(likedBy)
    await this.postsRepository.savePost(post)
  }

  async unlikePost(postId: string, unlikedBy: User) {
    const post = await this.postsRepository.findOneWithAuthorByIdAndLikedById(
      postId,
      unlikedBy.id
    )
    post.unlike(unlikedBy)
    await this.postsRepository.savePost(post)
  }

  async deletePost(postId: string, user: User) {
    await this.postsRepository.delete(postId, user)
    user.profile.decrementPostCount()
    await this.usersRepository.save(user)
  }
}
