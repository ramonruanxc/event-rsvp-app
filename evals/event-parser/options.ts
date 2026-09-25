import { parseArgs } from 'node:util';
import { PROVIDER_KEY_ENV, type ProviderEnv } from '@/lib/ai/providers-config';
import {
  REASONING_EFFORT_SETTINGS,
  resolveReasoningEffort,
  type ReasoningEffortSetting,
} from '@/lib/ai/reasoning';
import { AI_PROVIDER_NAMES, type AiProviderName } from '@/lib/ai/types';

/** Validated command-line options of the eval runner (REQ-93, REQ-107). */
export interface EvalOptions {
  provider: AiProviderName;
  model: string;
  cases: string;
  out: string;
  runs: number;
  reasoningEffort: ReasoningEffortSetting;
}

function readArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: {
      provider: { type: 'string', default: 'openrouter' }, // REQ-93: OpenRouter is the default (2026-09-25)
      model: { type: 'string' },
      cases: { type: 'string', default: 'evals/event-parser/cases.json' },
      out: { type: 'string', default: 'docs/evals' },
      runs: { type: 'string', default: '3' },
      'reasoning-effort': { type: 'string' },
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

  const runsText = String(values.runs).trim();
  if (!/^[1-9]\d*$/.test(runsText)) return { error: '--runs must be a positive integer' };
  const effortFlag = values['reasoning-effort'];
  let reasoningEffort: ReasoningEffortSetting;
  if (effortFlag === undefined) {
    reasoningEffort = resolveReasoningEffort(env.OPENROUTER_REASONING_EFFORT);
  } else {
    const normalized = effortFlag.trim().toLowerCase();
    if (!(REASONING_EFFORT_SETTINGS as readonly string[]).includes(normalized)) {
      return {
        error: `--reasoning-effort must be one of: ${REASONING_EFFORT_SETTINGS.join(', ')}`,
      };
    }
    reasoningEffort = normalized as ReasoningEffortSetting;
  }

  return {
    provider: name,
    model: values.model,
    cases: String(values.cases),
    out: String(values.out),
    runs: Number(runsText),
    reasoningEffort,
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
