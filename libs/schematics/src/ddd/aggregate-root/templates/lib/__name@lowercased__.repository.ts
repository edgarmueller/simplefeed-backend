import { Injectable } from '@nestjs/common';
import { DomainEvents } from '@kittgen/shared-ddd';
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
        where: { id }
      });
      return found<%= typeName %>;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new <%= typeName %>NotFoundError();
      }
      throw error;
    }
  }

  <%  for (let prop of queryableProps) { %>
  async findOneBy<%= capitalize(prop)%>(<%= lowercased(prop) %>: <%= props[prop].type %>): Promise<<%= typeName %>> {
    const user = await this.<%= lowercased(name) %>Repository.findOne({ where: { <%= prop %> } })
    if (<%= lowercased(name) %>) {
      return <%= lowercased(name) %>;
    }
    throw new <%= typeName %>NotFoundError()
  }
  <% } %>
}
