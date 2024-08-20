import { ConflictException } from '@nestjs/common';
import { PostId } from '../post';

export class PostAlreadyExistsError extends ConflictException {
  constructor(postId: PostId) {
    super(`Post ${postId} already exists`);
  }
}
