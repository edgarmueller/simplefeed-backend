import { IDomainEvent } from '@realworld/shared-ddd';
import { <%= typeName %> } from '../<%= lowercased(name) %>';

export class <%= typeName %>CreatedEvent implements IDomainEvent {
  public timestamp: Date;
  public <%= lowercased(name) %>: <%= typeName %>;

  constructor(<%= lowercased(name) %>: <%= typeName %>) {
    this.timestamp = new Date();
    this.<%= lowercased(name) %> = <%= lowercased(name) %>;
  }

  getAggregateId(): string {
    return this.<%= lowercased(name) %>.id;
  }
}
