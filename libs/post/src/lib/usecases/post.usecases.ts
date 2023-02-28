import { PostsRepository } from '../post.repository';
import { User, UsersRepository } from '@kittgen/user';
import { Post } from '../post';
import { Injectable } from '@nestjs/common';

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
      postedTo,
      author,
    });
    author.profile.incrementPostCount();
    await this.usersRepository.save(author);
    return await this.postsRepository.save(post);
  }
}
