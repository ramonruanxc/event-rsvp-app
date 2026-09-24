import type { z } from 'zod';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'NOT_OWNER'
  | 'EVENT_ENDED'
  | 'DUPLICATE_NAME'
  | 'RATE_LIMITED'
  | 'AI_LIMIT_REACHED'
  | 'AI_UNAVAILABLE'
  | 'UNAUTHENTICATED'
  | 'INTERNAL_ERROR';

export const VALIDATION_KEYS = [
  'required',
  'tooLong',
  'invalidFormat',
  'invalidTimezone',
  'inPast',
  'partySizeRange',
  'invalidStatus',
] as const;
export type ValidationKey = (typeof VALIDATION_KEYS)[number];
export type FieldErrors = Record<string, ValidationKey>;

/** Base class of every expected, user-facing failure. */
export abstract class DomainError extends Error {
  abstract readonly code: Exclude<ErrorCode, 'INTERNAL_ERROR'>;
}

/** Raised when input fails schema validation; carries one key per invalid field. */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const;
  constructor(readonly fieldErrors: FieldErrors) {
    super('VALIDATION_ERROR');
  }
  /** Keeps the first issue per field; path [] becomes "form"; unknown messages become "invalidFormat". */
  static fromZod(error: z.ZodError): ValidationError {
    const fieldErrors: FieldErrors = {};
    for (const issue of error.issues) {
      const key = issue.path.length ? issue.path.join('.') : 'form';
      if (key in fieldErrors) continue;
      fieldErrors[key] = (VALIDATION_KEYS as readonly string[]).includes(issue.message)
        ? (issue.message as ValidationKey)
        : 'invalidFormat';
    }
    return new ValidationError(fieldErrors);
  }
}
/** Raised when the requested resource does not exist. */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND' as const;
  constructor() {
    super('NOT_FOUND');
  }
}
/** Raised when the current user is not the owner of the resource. */
export class NotOwnerError extends DomainError {
  readonly code = 'NOT_OWNER' as const;
  constructor() {
    super('NOT_OWNER');
  }
}
/** Raised when an action is attempted on an event that has already ended. */
export class EventEndedError extends DomainError {
  readonly code = 'EVENT_ENDED' as const;
  constructor() {
    super('EVENT_ENDED');
  }
}
/** Raised when an RSVP name already exists for the event. */
export class DuplicateNameError extends DomainError {
  readonly code = 'DUPLICATE_NAME' as const;
  constructor() {
    super('DUPLICATE_NAME');
  }
}
/** Raised when a caller exceeds a rate limit. */
export class RateLimitedError extends DomainError {
  readonly code = 'RATE_LIMITED' as const;
  constructor() {
    super('RATE_LIMITED');
  }
}
/** Raised when the daily AI usage limit has been reached. */
export class AiLimitReachedError extends DomainError {
  readonly code = 'AI_LIMIT_REACHED' as const;
  constructor() {
    super('AI_LIMIT_REACHED');
  }
}
/** Raised when the AI provider is unavailable or times out. */
export class AiUnavailableError extends DomainError {
  readonly code = 'AI_UNAVAILABLE' as const;
  constructor() {
    super('AI_UNAVAILABLE');
  }
}
/** Raised when an action requires a signed-in user and none is present. */
export class UnauthenticatedError extends DomainError {
  readonly code = 'UNAUTHENTICATED' as const;
  constructor() {
    super('UNAUTHENTICATED');
  }
}
