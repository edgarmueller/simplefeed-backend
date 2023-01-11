import { <%= typeName %>Id } from '../<%= lowercased(name) %>';

export class <%= typeName %>NotFoundError extends Error {
  constructor() {
    super(`<%= typeName %> not found`);
  }
}
