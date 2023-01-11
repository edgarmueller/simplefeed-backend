import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@realworld/shared-ddd';
import { Transactional } from 'typeorm-transactional';
import { Repository } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { InjectRepository } from '@nestjs/typeorm';
import { EventPublisher } from '@nestjs/cqrs';
import { <%= typeName %>NotFoundError } from './errors/<%= lowercased(name) %>-not-found.error';
import { <%= typeName %>, <%= typeName %>Id  } from './<%= lowercased(name) %>';

@Injectable()
export class <%= pluralize(typeName) %>Repository {
  constructor(
    @InjectRepository(<%= typeName %>) private readonly <%= lowercased(name) %>Repository: Repository<<%= typeName %>>,
    private readonly publisher: EventPublisher
  ) {
  }

  @Transactional()
  async save(<%= lowercased(name) %>: <%= typeName %>): Promise<<%= typeName %>> {
    const saved<%= typeName %> = await this.<%= lowercased(name) %>Repository.save(<%= lowercased(name) %>);
    DomainEvents.dispatchEventsForAggregate(<%= lowercased(name) %>.id, this.publisher);
    return saved<%= typeName %>;
  }

  async findAll(): Promise<<%= typeName %>[]> {
    const <%= lowercased(name) %>s = await this.<%= lowercased(name) %>Repository.find();
    return <%= lowercased(name) %>s;
  }

  async findOneByIdOrFail(id: <%= typeName %>Id): Promise<<%= typeName %>> {
    try {
      const found<%= typeName %> = await this.<%= lowercased(name) %>Repository.findOneOrFail({
        where: { id: id.toString() }
      });
      return found<%= typeName %>;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new <%= typeName %>NotFoundError(id);
      }
      throw error;
    }
  }
}
