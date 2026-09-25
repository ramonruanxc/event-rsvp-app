import type { ProviderEnv } from '@/lib/ai/providers-config';
import type { HttpFetch } from './keys-api';

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
export async function runProvisionCli(_deps: CliDeps): Promise<number> {
  throw new Error('not implemented');
}
