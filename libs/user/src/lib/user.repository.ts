import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@simplefeed/shared-ddd'
import { Propagation, Transactional } from 'typeorm-transactional'
import { In } from 'typeorm'
import { QueryFailedError, Repository } from 'typeorm'
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
  ) { }

  @Transactional({
    propagation: Propagation.NESTED,
  })
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
      users.map(async (user) => this.save(user))
    )
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

  async findOneByIdWithFriendsOrFail(id: UserId): Promise<User> {
    try {
      const foundUser = await this.userRepository.findOneOrFail({
        where: { id },
        relations: {
          profile: true,
          friends: true,
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
      })
      return foundUser
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UserNotFoundError(username)
      }
      throw error
    }
  }
  async findOneByUsernameWithFriendRequestsOrFail(username: string): Promise<User> {
    try {
      const foundUser = await this.userRepository.findOneOrFail({
        where: { profile: { username } },
        relations: { friendRequests: true },
      })
      return foundUser
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UserNotFoundError(username)
      }
      throw error
    }
  }

  async findOneByUsernameWithFriendsOrFail(username: string): Promise<User> {
    try {
      const foundUser = await this.userRepository.findOneOrFail({
        where: { profile: { username } },
        relations: {
          friends: true,
        },
      })
      return foundUser
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UserNotFoundError(username)
      }
      throw error
    }
  }

  async findOneByEmailOrFail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: { profile: true },
    })
    if (user) {
      return user
    }
    throw new UserNotFoundError()
  }

  findMany(userIds: string[]) {
    return this.userRepository.find({
      where: { id: In(userIds) },
      relations: { profile: true },
    })
  }

  async deleteAll() {
    await this.friendRequestsRepository.delete({})
    await this.userRepository.delete({})
  }

  async deleteByEmail(email: string) {
    const user = await this.findOneByEmailOrFail(email)
    await this.friendRequestsRepository.delete({
      from: { id: user.id },
    })
    await this.userRepository.delete(user.id)
  }

  async softDeleteByEmail(email: string) {
    const user = await this.findOneByEmailOrFail(email)
    await this.friendRequestsRepository.softDelete({
      from: { id: user.id },
    })
    await this.userRepository.softDelete(user.id)
    DomainEvents.dispatchEventsForAggregate(user.id, this.publisher)
  }

  @Transactional()
  async restoreByEmail(email: string) {
    await this.userRepository.restore({ email })
    const user = await this.findOneByEmailOrFail(email);
    user.restore();
    await this.friendRequestsRepository.restore({
      from: { id: user.id },
    })
    DomainEvents.dispatchEventsForAggregate(user.id, this.publisher)
    return user;
  }
}
