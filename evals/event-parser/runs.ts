import { ProviderUnavailableError } from '@/lib/ai/errors';
import { AI_TIMEOUT_MS, type ParseEventResult } from '@/lib/ai/types';
import type { CaseRuns, EvalCase, RunResult, RunStatus } from './types';

/** Status of one run (REQ-101): a result → ok; ≥ AI_TIMEOUT_MS or a client timeout → timeout; other outage → outage; else invalid. */
export function classifyRun(run: {
  outcome: ParseEventResult | { error: string };
  latencyMs: number;
  clientError: unknown;
}): RunStatus {
  if (!('error' in run.outcome)) return 'ok';
  if (run.latencyMs >= AI_TIMEOUT_MS) return 'timeout';
  if (run.clientError instanceof ProviderUnavailableError) {
    return run.clientError.reason === 'timeout' ? 'timeout' : 'outage';
  }
  return 'invalid';
}

/** Aggregates one case's runs: passes iff ≥ 1 answered run and every answered run is ok and passes (REQ-100). */
export function aggregateRuns(_evalCase: EvalCase, _runs: RunResult[]): CaseRuns {
  throw new Error('not implemented');
}
