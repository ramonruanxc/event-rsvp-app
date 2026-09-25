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
export async function provisionKey(api: KeysApi, input: ProvisionInput): Promise<ProvisionResult> {
  const { name, limit } = input;
  const found = (await api.list()).find((key) => key.name === name);
  if (!found) {
    const created = await api.create({ name, limit });
    return { action: 'created', info: created.info, newKey: created.key };
  }
  if (input.rotate) {
    await api.remove(found.hash);
    const created = await api.create({ name, limit });
    return { action: 'rotated', info: created.info, newKey: created.key };
  }
  if (found.disabled)
    throw new ProvisionError(`Key "${name}" is disabled — re-run with --rotate to replace it.`);
  if (!input.existingApiKey) {
    throw new ProvisionError(
      `Key "${name}" exists but OPENROUTER_API_KEY is not in the env file — re-run with --rotate to replace it.`,
    );
  }
  if (found.limit !== limit)
    return { action: 'limit-updated', info: await api.update(found.hash, { limit }) };
  return { action: 'reused', info: found };
}
