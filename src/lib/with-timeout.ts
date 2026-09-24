/** Raised by withTimeout when the wrapped promise does not settle in time (REQ-47, BR-64). */
export class TimeoutError extends Error {
  constructor() {
    super('TimeoutError');
    this.name = 'TimeoutError';
  }
}

/** Rejects with TimeoutError if `promise` does not settle within `ms`; otherwise settles like `promise`. */
export function withTimeout<T>(_promise: Promise<T>, _ms: number): Promise<T> {
  return Promise.reject(new Error('not implemented'));
}
