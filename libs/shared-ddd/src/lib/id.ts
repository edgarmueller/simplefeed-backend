import { uuid } from 'short-uuid'

export const createId =
  (prefix: string): (() => string) =>
  () =>
    `${prefix}-${uuid()}`
