import { parseArgs } from 'node:util';
import type { ProviderEnv } from '@/lib/ai/providers-config';
import { readEnvValue, upsertEnvValue } from './env-file';
import { createKeysApi, KeysApiError, type HttpFetch } from './keys-api';
import { provisionKey, ProvisionError } from './provision';

/** Dependencies of runProvisionCli, injected so tests never touch a real filesystem or network. */
export interface CliDeps {
  argv: string[];
  env: ProviderEnv;
  fetch: HttpFetch;
  readFile(path: string): string | undefined;
  writeFile(path: string, content: string): void;
  out(line: string): void;
  err(line: string): void;
}

/** `npm run openrouter:key` implementation: provisions the OpenRouter key, never prints a secret (REQ-98, REQ-97). */
export async function runProvisionCli(deps: CliDeps): Promise<number> {
  let values: {
    name?: string;
    limit?: string;
    'env-file'?: string;
    rotate?: boolean;
  };
  try {
    values = parseArgs({
      args: deps.argv,
      options: {
        name: { type: 'string', default: 'event-rsvp-app' },
        limit: { type: 'string', default: '3' },
        'env-file': { type: 'string', default: '.env.local' },
        rotate: { type: 'boolean', default: false },
      },
    }).values;
  } catch (error) {
    deps.err(error instanceof Error ? error.message : String(error));
    return 2;
  }

  const limit = Number(values.limit);
  if (!Number.isFinite(limit) || limit <= 0) {
    deps.err('--limit must be a positive number of USD');
    return 2;
  }

  const managementKey =
    deps.env.OPENROUTER_MANAGMENT_KEY?.trim() || deps.env.OPENROUTER_MANAGEMENT_KEY?.trim();
  if (!managementKey) {
    deps.err(
      'OPENROUTER_MANAGMENT_KEY is not set — ask the human to set it as a system environment variable.',
    );
    return 2;
  }

  const name = values.name ?? 'event-rsvp-app';
  const envFile = values['env-file'] ?? '.env.local';
  const rotate = values.rotate ?? false;

  const content = deps.readFile(envFile) ?? '';
  const existingApiKey = readEnvValue(content, 'OPENROUTER_API_KEY');

  let result;
  try {
    result = await provisionKey(createKeysApi({ fetch: deps.fetch, managementKey }), {
      name,
      limit,
      rotate,
      existingApiKey,
    });
  } catch (error) {
    if (error instanceof ProvisionError || error instanceof KeysApiError) {
      deps.err(error.message);
      return 1;
    }
    deps.err(`provisioning failed: ${error instanceof Error ? error.name : 'unknown error'}`);
    return 1;
  }

  if (result.newKey) {
    deps.writeFile(envFile, upsertEnvValue(content, 'OPENROUTER_API_KEY', result.newKey));
  }

  const { info } = result;
  deps.out(`name: ${info.name}`);
  deps.out(info.limit === null ? 'limit: none' : `limit: ${info.limit} USD`);
  deps.out(`usage: ${info.usage} USD`);
  deps.out(`action: ${result.action}`);
  if (result.newKey) deps.out(`OPENROUTER_API_KEY written to ${envFile}`);
  return 0;
}
