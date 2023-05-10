import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@kittgen/shared-ddd'
import { Transactional } from 'typeorm-transactional'
import { In, QueryFailedError, Repository } from 'typeorm'
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError'
import { InjectRepository } from '@nestjs/typeorm'
import { EventPublisher } from '@nestjs/cqrs'
import { UserNotFoundError } from './errors/user-not-found.error'
import { User, UserId } from './user'
import { UserAlreadyExistsError } from './errors/user-already-exists.error'
import { FriendRequest } from './friend-request'

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
    private readonly publisher: EventPublisher
  ) {}

  @Transactional()
  async save(user: User): Promise<User> {
    try {
      const savedUser = await this.userRepository.save(user)
      // await this.profileRepository.save(user.profile)
      DomainEvents.dispatchEventsForAggregate(user.id, this.publisher)
      return savedUser
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (error.driverError.detail.startsWith('Key (email)')) {
          throw new UserAlreadyExistsError(user.email)
        }
      }
      throw error
    }
  }

  @Transactional()
  async saveMany(users: User[]): Promise<User[]> {
    return Promise.all(
      users.map(async (user) => {
        return await this.save(user)
      })
    )
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find()
    return users
  }

  async findOneByIdOrFail(id: UserId): Promise<User> {
    try {
      const foundUser = await this.userRepository.findOneOrFail({
        where: { id },
        relations: {
          profile: true,
        },
      })
      return foundUser
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UserNotFoundError()
      }
      throw error
    }
  }

  async findOneByUsernameOrFail(username: string): Promise<User> {
    try {
      const foundUser = await this.userRepository.findOneOrFail({
        where: { profile: { username } },
        relations: {
          friends: true,
        }
      })
      return foundUser
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UserNotFoundError(username)
      }
      throw error
    }
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { profile: true },
    })
    if (user) {
      return user
    }
    throw new UserNotFoundError()
  }

  async deleteByEmail(email: string) {
    const user = await this.findOneByEmail(email)
    await this.friendRequestsRepository.delete({
      from: { id: user.id },
    })
    await this.userRepository.delete(user.id)
  }

  findFriendRequestById(friendRequestId: string) {
    return this.friendRequestsRepository.findOneOrFail({
      where: { id: friendRequestId },
    });
  }

  findByFriendRequest(friendRequest: FriendRequest) {
    return this.userRepository.find({
      where: { id: In([friendRequest.from.id, friendRequest.to.id]) },
      relations:{
        incomingFriendRequests: true,
        outgoingFriendRequests: true,
        friends: true,
      }
    })
  }
}
