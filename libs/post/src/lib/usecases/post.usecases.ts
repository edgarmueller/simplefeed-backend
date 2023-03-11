import { PostsRepository } from '../post.repository';
import { User, UsersRepository } from '@kittgen/user';
import { Post } from '../post';
import { Injectable } from '@nestjs/common';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';

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
      postedTo: postedTo?.profile,
      author: author.profile,
    });
    author.profile.incrementPostCount();
    await this.usersRepository.save(author);
    return await this.postsRepository.save(post);
  }

  async findPosts(user: User, paginationOpts: IPaginationOptions): Promise<Pagination<Post>> {
    const { profile } = await this.usersRepository.findOneByIdOrFail(user.id)
    const friends = profile.friends.map(friend => friend.user.id);
    const posts = await this.postsRepository.findPostsByUsers([user.id, ...friends], paginationOpts);
    return posts;
  }
}
