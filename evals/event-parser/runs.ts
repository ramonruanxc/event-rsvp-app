import { DomainError } from '@/domain/errors';
import { ProviderUnavailableError } from '@/lib/ai/errors';
import {
  AI_TIMEOUT_MS,
  type AiModelClient,
  type EventTextParser,
  type ParseEventResult,
} from '@/lib/ai/types';
import { scoreCase } from './score';
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
export function aggregateRuns(evalCase: EvalCase, runs: RunResult[]): CaseRuns {
  const answered = runs.filter((run) => run.status === 'ok' || run.status === 'invalid');
  const passed =
    answered.length > 0 && answered.every((run) => run.status === 'ok' && run.result.passed);
  return {
    id: evalCase.id,
    category: evalCase.category,
    holdout: evalCase.holdout === true,
    runs,
    passed,
  };
}

/** Wraps a model client and remembers the last error it threw, handed over once by `takeError` (REQ-101). */
export function recordingClient(_client: AiModelClient): {
  client: AiModelClient;
  takeError: () => unknown;
} {
  throw new Error('not implemented');
}

/** What runCase needs: the parser call, the recorded client error and a millisecond clock. */
export interface RunCaseDeps {
  parse: EventTextParser['parse'];
  takeClientError: () => unknown;
  clock: () => number;
}

/** Runs one case `runs` times, timing, classifying and scoring each run (REQ-100, REQ-101). */
export async function runCase(
  _evalCase: EvalCase,
  _runs: number,
  _deps: RunCaseDeps,
): Promise<CaseRuns> {
  throw new Error('not implemented');
}
