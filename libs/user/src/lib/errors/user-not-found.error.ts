import { NotFoundException } from "@nestjs/common";

export class UserNotFoundError extends NotFoundException {
  constructor(criteria?: string) {
    super(criteria ? `User ${criteria} not found` : `User not found`);
  }
}
