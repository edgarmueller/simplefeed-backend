import { DomainEvents } from '@kittgen/shared-ddd'
import { Injectable } from '@nestjs/common'
import { EventPublisher } from '@nestjs/cqrs'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryFailedError, Repository } from 'typeorm'
import { Transactional } from 'typeorm-transactional'
import { FriendRequestAlreadyExistsError } from './errors/friend-request-already-exists.error'
import { FriendRequest } from './friend-request'

@Injectable()
export class FriendRequestRepository {
  constructor(
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async save(friendRequest: FriendRequest): Promise<FriendRequest> {
    try {
      const savedFriendRequest = await this.friendRequestsRepository.save(friendRequest)
      DomainEvents.dispatchEventsForAggregate(savedFriendRequest.id, this.publisher)
      return savedFriendRequest;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (error.driverError.detail.startsWith('Key (email)')) {
          throw new FriendRequestAlreadyExistsError(friendRequest.from.id, friendRequest.to.id);
        }
      }
      throw error
    }
  }

  findOneById(friendRequestId: string) {
    return this.friendRequestsRepository.findOneOrFail({
      where: { id: friendRequestId },
    });
  }

  findOneByIdWithFriends(friendRequestId: string) {
    return this.friendRequestsRepository.findOneOrFail({
      where: { id: friendRequestId },
      relations: {
        from: {
          friends: true,
          friendRequests: true,

        },
        to: {
          friends: true,
          friendRequests: true
        },
      }
    });
  }

  findFriendRequestsForUserId(userId: string) {
    return this.friendRequestsRepository.find({
      where: { to: { id: userId } },
      relations: {
        from: true,
        to: true,
      }
    })
  }

  findFriendRequestsFromUserId(userId: string) {
    return this.friendRequestsRepository.find({
      where: { from: { id: userId } },
      relations: {
        from: true,
        to: true,
      }
    })
  }

  async delete(friendRequest: FriendRequest) {
    await this.friendRequestsRepository.remove(friendRequest);
    DomainEvents.dispatchEventsForAggregate(friendRequest.id, this.publisher)
  }
}
