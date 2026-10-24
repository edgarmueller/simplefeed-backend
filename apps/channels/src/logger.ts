/** The subset of `console` the worker logs through, so tests can silence it. */
export type Logger = Pick<Console, 'log' | 'warn' | 'error'>
