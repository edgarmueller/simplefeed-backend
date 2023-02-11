import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@kittgen/shared-ddd';
import { Transactional } from 'typeorm-transactional';
import { Repository } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { InjectRepository } from '@nestjs/typeorm';
import { EventPublisher } from '@nestjs/cqrs';
import { UserNotFoundError } from './errors/user-not-found.error';
import { User, UserId  } from './user';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly publisher: EventPublisher
  ) {
  }

  @Transactional()
  async save(user: User): Promise<User> {
    const savedUser = await this.userRepository.save(user);
    DomainEvents.dispatchEventsForAggregate(user.id, this.publisher);
    return savedUser;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users;
  }

  async findOneByIdOrFail(id: UserId): Promise<User> {
    try {
      const foundUser = await this.userRepository.findOneOrFail({
        where: { id }
      });
      return foundUser;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UserNotFoundError();
      }
      throw error;
    }
  }

  async findOneByUsernameOrFail(username: string): Promise<User> {
    try {
      const foundUser = await this.userRepository.findOneOrFail({
        where: { profile: { username } }
      });
      return foundUser;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new UserNotFoundError();
      }
      throw error;
    }
  }
  
  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email }, relations: { profile: true } })
    if (user) {
      return user;
    }
    throw new UserNotFoundError()
  }
  
}
