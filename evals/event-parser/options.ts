import { parseArgs } from 'node:util';
import { PROVIDER_KEY_ENV, type ProviderEnv } from '@/lib/ai/providers-config';
import { AI_PROVIDER_NAMES, type AiProviderName } from '@/lib/ai/types';

/** Validated command-line options of the eval runner (REQ-93). */
export interface EvalOptions {
  provider: AiProviderName;
  model: string;
  cases: string;
  out: string;
}

function readArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: {
      provider: { type: 'string', default: 'openrouter' }, // REQ-93: OpenRouter is the default (2026-09-25)
      model: { type: 'string' },
      cases: { type: 'string', default: 'evals/event-parser/cases.json' },
      out: { type: 'string', default: 'docs/evals' },
    },
  }).values;
}

/** Parses and checks the runner's arguments; returns `{ error }` when a check fails (REQ-93). */
export function parseEvalOptions(
  argv: string[],
  env: ProviderEnv,
): EvalOptions | { error: string } {
  let values: ReturnType<typeof readArgs>;
  try {
    values = readArgs(argv);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  const provider = String(values.provider);
  if (!(AI_PROVIDER_NAMES as readonly string[]).includes(provider)) {
    return { error: `--provider must be one of: ${AI_PROVIDER_NAMES.join(', ')}` };
  }
  const name = provider as AiProviderName;
  const keyVar = PROVIDER_KEY_ENV[name];
  if (!env[keyVar]?.trim()) return { error: `${keyVar} is not set — ask the human to provide it.` };
  if (!values.model) return { error: '--model is required' };
  return {
    provider: name,
    model: values.model,
    cases: String(values.cases),
    out: String(values.out),
  };
}

/** Model label used in the report title: the model id, prefixed with the provider unless it is Anthropic. */
export function reportLabel(provider: AiProviderName, model: string): string {
  return provider === 'anthropic' ? model : `${provider}:${model}`;
}

/** Report file name; characters outside [A-Za-z0-9._-] in the model id become "-". */
export function reportFileName(date: string, provider: AiProviderName, model: string): string {
  const safe = model.replace(/[^A-Za-z0-9._-]/g, '-');
  return provider === 'anthropic' ? `${date}-${safe}.md` : `${date}-${provider}-${safe}.md`;
}
