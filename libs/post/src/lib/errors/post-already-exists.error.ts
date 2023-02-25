import { PostId } from '../post';

export class PostAlreadyExistsError extends Error {
  constructor(postId: PostId) {
    super(`Post ${postId} already exists`);
  }
}
