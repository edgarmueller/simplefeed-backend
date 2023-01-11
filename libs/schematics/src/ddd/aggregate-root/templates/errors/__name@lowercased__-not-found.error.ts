import { <%= typeName %>Id } from '../<%= lowercased(name) %>';

export class <%= typeName %>NotFoundError extends Error {
  constructor(<%= lowercased(name) %>Id: <%= typeName %>Id) {
    super(`<%= typeName %> ${<%= lowercased(name) %>Id} not found`);
  }
}
