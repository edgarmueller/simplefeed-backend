import { ConflictException } from '@nestjs/common';
import { UserId } from '../user';

export class FriendRequestAlreadyExistsError extends ConflictException {
  constructor(from: UserId, to: UserId) {
    super(`Friend request from ${from} to ${to} already exists`);
  }
}
