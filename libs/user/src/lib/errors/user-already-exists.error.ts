import { UserId } from '../user';

export class UserAlreadyExistsError extends Error {
  constructor(userId: UserId) {
    super(`User ${userId} already exists`);
  }
}
