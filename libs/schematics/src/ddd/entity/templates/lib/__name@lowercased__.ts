import { Entity, Props, createId } from '@kittgen/shared-ddd';
<%  for (let entity of imports) { %>
import { <%= entity %> } from "./<%= lowercased(entity) %>" <% } %>

const PREFIX = '<%= name.substr(0, 3).toLowerCase() %>'
export type <%= classify(typeName) %>Id = string
const create<%= classify(typeName) %>Id = createId(PREFIX)

export class <%= typeName %> implements Entity {
  <%  for (let field of simpleProps) { %>
  <%= field %><%= !props[field].required ? '?' : ''%>: <%= props[field].type %> <% } %>
  <% for (const ref of stringifiedRefs) { %>
  <%= ref %> <% } %>

  public static create(props: Props<<%= typeName %>>, id?: string): <%= typeName %> {
    const <%= lowercased(name) %> = new <%= typeName %>({ ...props }, id);
    return <%= lowercased(name) %>;
  }

  private constructor(props: Props<<%= typeName %>>, readonly id: string) {
    Object.assign(this, props)
    this.id = id || create<%= classify(typeName) %>Id()
  }

  // TODO: add domain logic
}
