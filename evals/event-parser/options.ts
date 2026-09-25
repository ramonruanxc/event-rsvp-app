import type { ProviderEnv } from '@/lib/ai/providers-config';
import type { AiProviderName } from '@/lib/ai/types';

/** Validated command-line options of the eval runner (REQ-93). */
export interface EvalOptions {
  provider: AiProviderName;
  model: string;
  cases: string;
  out: string;
}

/** Parses and checks the runner's arguments; returns `{ error }` when a check fails (REQ-93). */
export function parseEvalOptions(
  _argv: string[],
  _env: ProviderEnv,
): EvalOptions | { error: string } {
  throw new Error('not implemented');
}

/** Model label used in the report title: the model id, prefixed with the provider unless it is Anthropic. */
export function reportLabel(_provider: AiProviderName, _model: string): string {
  throw new Error('not implemented');
}

/** Report file name; characters outside [A-Za-z0-9._-] in the model id become "-". */
export function reportFileName(_date: string, _provider: AiProviderName, _model: string): string {
  throw new Error('not implemented');
}
