import { NotFoundException } from "@nestjs/common";

export class CommentNotFoundError extends NotFoundException {
  constructor() {
    super(`Comment not found`);
  }
}
