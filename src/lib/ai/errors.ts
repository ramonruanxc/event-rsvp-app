/** Why a provider could not serve a request; every reason allows failover (BR-121). `auth` = HTTP 401/403. */
export type OutageReason = 'network' | 'server' | 'rate-limit' | 'timeout' | 'credit' | 'auth';

/** Outage-type failure of one provider: the next configured provider may be tried (BR-121). */
export class ProviderUnavailableError extends Error {
  constructor(readonly reason: OutageReason) {
    super(`AI provider unavailable: ${reason}`);
    this.name = 'ProviderUnavailableError';
  }
}

/** The provider answered, but not with usable structured output; never retried elsewhere (BR-122). */
export class InvalidModelOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidModelOutputError';
  }
}
