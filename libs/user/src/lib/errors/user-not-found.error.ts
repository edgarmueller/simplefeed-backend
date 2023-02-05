import { UserId } from '../user';

export class UserNotFoundError extends Error {
  constructor() {
    super(`User not found`);
  }
}
