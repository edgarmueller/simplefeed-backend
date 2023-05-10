import { UserId } from '../user';

export class FriendRequestAlreadyExistsError extends Error {
  constructor(from: UserId, to: UserId) {
    super(`Friend request from ${from} to ${to} already exists`);
  }
}
