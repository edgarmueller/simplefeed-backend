export class UserNotFoundError extends Error {
  constructor(criteria?: string) {
    super(criteria ? `User ${criteria} not found` : `User not found`);
  }
}
