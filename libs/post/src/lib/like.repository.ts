import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like } from './like'
import { Transactional } from 'typeorm-transactional'
import { Repository } from 'typeorm'

@Injectable()
export class LikeRepository {
  constructor(
    @InjectRepository(Like) private readonly likeRepository: Repository<Like>,
  ) {}

  @Transactional()
  async delete(like: Like) {
    await this.likeRepository.remove(like)
  }
}
