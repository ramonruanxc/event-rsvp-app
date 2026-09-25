import type { KeyInfo, KeysApi } from './keys-api';

/** What provisionKey did to the named key. */
export type ProvisionAction = 'created' | 'reused' | 'limit-updated' | 'rotated';

/** Desired state of the named OpenRouter key. */
export interface ProvisionInput {
  name: string;
  limit: number;
  rotate: boolean;
  existingApiKey: string | undefined;
}

/** Outcome of provisionKey: the action taken, the key's info and a new secret when one was created. */
export interface ProvisionResult {
  action: ProvisionAction;
  info: KeyInfo;
  newKey?: string;
}

/** Raised when provisioning cannot proceed safely without --rotate. */
export class ProvisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProvisionError';
  }
}

/** Creates, reuses, re-limits or rotates the named OpenRouter key (REQ-98, BR-126). */
export async function provisionKey(
  _api: KeysApi,
  _input: ProvisionInput,
): Promise<ProvisionResult> {
  throw new Error('not implemented');
}
