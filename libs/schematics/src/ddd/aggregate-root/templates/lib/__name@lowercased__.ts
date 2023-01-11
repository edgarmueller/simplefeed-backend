import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd';
import { <%= typeName %>CreatedEvent } from './events/<%= lowercased(name) %>-created.event';
<%  for (let entity of imports) { %>import { <%= entity %> } from "./<%= lowercased(entity) %>" <% } %>

const PREFIX = '<%= name.substr(0, 3).toLowerCase() %>'
export type <%= classify(typeName) %>Id = string
const create<%= classify(typeName) %>Id = createId(PREFIX)

export class <%= typeName %> extends AggregateRoot {
  <%  for (let field of simpleProps) { %>
  <%= field %><%= !props[field].required ? '?' : ''%>: <%= props[field].type %> <% } %>
  <% for (const ref of stringifiedRefs) { %>
  <%= ref %> <% } %>

  public static create(props: Props<<%= typeName %>>, id?: string): <%= typeName %> {
    const isNew<%= typeName %> = !!id === false;
    const <%= lowercased(name) %> = new <%= typeName %>({ ...props }, id);

    if (isNew<%= typeName %>) {
      <%= lowercased(name) %>.emitDomainEvent(new <%= typeName %>CreatedEvent(<%= lowercased(name) %>));
    }

    return <%= lowercased(name) %>;
  }

  private constructor(props: Props<<%= typeName %>>, id?: string) {
    super(props, id || create<%= typeName %>Id());
  }

  // TODO: add domain logic
}
