import { PostsRepository } from '../post.repository';
import { User, UsersRepository } from '@kittgen/user';
import { Post } from '../post';
import { Injectable } from '@nestjs/common';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { CommentPostDto } from './dto/comment-post.dto';
import { Comment } from '../comment';
import { GetCommentDto } from './dto/get-comment.dto';

@Injectable()
export class PostUsecases {
  constructor(
    readonly usersRepository: UsersRepository,
    readonly postsRepository: PostsRepository
  ) {}

  async submitPost(body: string, author: User, toUserId?: string): Promise<Post> {
    let postedTo: User | undefined;
    if (toUserId) {
      try {
        postedTo = await this.usersRepository.findOneByIdOrFail(toUserId)
      } catch (error) {
        throw new Error('User not found');
      }
    }
    const post = Post.create({
      body,
      postedTo: postedTo,
      author: author,
    });
    author.profile.incrementPostCount();
    await this.usersRepository.save(author);
    return await this.postsRepository.savePost(post);
  }

  async findPosts(user: User, paginationOpts: IPaginationOptions): Promise<Pagination<Post>> {
    const { profile } = await this.usersRepository.findOneByIdOrFail(user.id)
    const friends = profile.friends.map(friend => friend.user.id);
    const posts = await this.postsRepository.findPostsByUsers([user.id, ...friends], paginationOpts);
    return posts;
  }

  async postComment(user: User, postId: string, dto: CommentPostDto): Promise<Comment> {
    const post = await this.postsRepository.findOneByIdOrFail(postId);
    const comment = Comment.create({
      content: dto.content,
      author: user,
      post,
      path: dto.path,
    });
    return await this.postsRepository.saveComment(comment);
  }

  async fetchComments(postId: string, commentId?: string): Promise<Pagination<GetCommentDto>> {
    const page = await this.postsRepository.findComments(postId, commentId);
    return {
      ...page,
      items: page.items.map(GetCommentDto.fromDomain)
    }
  }
}
