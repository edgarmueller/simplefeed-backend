import { <%= typeName %>Id } from '../<%= lowercased(name) %>';

export class <%= typeName %>AlreadyExistsError extends Error {
  constructor(<%= lowercased(name) %>Id: <%= typeName %>Id) {
    super(`<%= typeName %> ${<%= lowercased(name) %>Id} already exists`);
  }
}
