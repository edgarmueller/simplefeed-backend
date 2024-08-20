import { ConflictException } from '@nestjs/common';
import { UserId } from '../user';

export class UserAlreadyExistsError extends ConflictException {
  constructor(userId: UserId) {
    super(`User ${userId} already exists`);
  }
}
