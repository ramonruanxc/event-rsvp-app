import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { eventNameSchema } from './schemas';
import {
  AiLimitReachedError,
  AiUnavailableError,
  DomainError,
  DuplicateNameError,
  EmailTakenError,
  EventEndedError,
  GoogleAccountExistsError,
  InvalidCredentialsError,
  NotFoundError,
  NotOwnerError,
  RateLimitedError,
  UnauthenticatedError,
  ValidationError,
} from './errors';

describe('ValidationError.fromZod', () => {
  it('REQ-59: fromZod keeps the first issue of each field', () => {
    const schema = z.object({ name: eventNameSchema, date: z.string().min(1, 'required') });
    const result = schema.safeParse({ name: '', date: '' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(ValidationError.fromZod(result.error).fieldErrors).toEqual({
      name: 'required',
      date: 'required',
    });
  });

  it('REQ-59: fromZod maps unknown messages to invalidFormat and root issues to form', () => {
    const objectResult = z.object({ a: z.number() }).safeParse({ a: 'x' });
    expect(objectResult.success).toBe(false);
    if (!objectResult.success) {
      expect(ValidationError.fromZod(objectResult.error).fieldErrors).toEqual({
        a: 'invalidFormat',
      });
    }

    const rootResult = z.string().safeParse(1);
    expect(rootResult.success).toBe(false);
    if (!rootResult.success) {
      expect(ValidationError.fromZod(rootResult.error).fieldErrors).toEqual({
        form: 'invalidFormat',
      });
    }
  });
});

describe('DomainError subclasses', () => {
  it('REQ-59: every domain error carries its code', () => {
    const cases: Array<[DomainError, string]> = [
      [new ValidationError({}), 'VALIDATION_ERROR'],
      [new NotFoundError(), 'NOT_FOUND'],
      [new NotOwnerError(), 'NOT_OWNER'],
      [new EventEndedError(), 'EVENT_ENDED'],
      [new DuplicateNameError(), 'DUPLICATE_NAME'],
      [new RateLimitedError(), 'RATE_LIMITED'],
      [new AiLimitReachedError(), 'AI_LIMIT_REACHED'],
      [new AiUnavailableError(), 'AI_UNAVAILABLE'],
      [new UnauthenticatedError(), 'UNAUTHENTICATED'],
    ];
    for (const [err, code] of cases) {
      expect(err.code).toBe(code);
      expect(err).toBeInstanceOf(DomainError);
    }
  });

  it('REQ-115: the credential errors carry their codes', () => {
    expect(new InvalidCredentialsError().code).toBe('INVALID_CREDENTIALS');
    expect(new EmailTakenError().code).toBe('EMAIL_TAKEN');
    expect(new GoogleAccountExistsError().code).toBe('GOOGLE_ACCOUNT_EXISTS');
    expect(new InvalidCredentialsError()).toBeInstanceOf(DomainError);
  });
});
