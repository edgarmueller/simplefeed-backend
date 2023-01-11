export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials')
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}