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

/** Maps an HTTP status to an outage reason, or null when the status is not an outage (BR-121). */
export function outageReasonForStatus(status: number): OutageReason | null {
  if (status === 401 || status === 403) return 'auth'; // invalid, revoked or unauthorized key
  if (status === 402) return 'credit';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate-limit';
  if (status >= 500 && status <= 599) return 'server';
  return null;
}
