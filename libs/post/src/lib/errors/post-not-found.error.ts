import { NotFoundException } from "@nestjs/common";

export class PostNotFoundError extends NotFoundException {
  constructor() {
    super(`Post not found`);
  }
}
