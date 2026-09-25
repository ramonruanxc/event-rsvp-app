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

/** Status of one run (REQ-101): a result → ok; AI_TIMEOUT, ≥ AI_TIMEOUT_MS or a client timeout →
 * timeout; other outage → outage; else invalid. */
export function classifyRun(run: {
  outcome: ParseEventResult | { error: string };
  latencyMs: number;
  clientError: unknown;
}): RunStatus {
  if (!('error' in run.outcome)) return 'ok';
  if (run.outcome.error === 'AI_TIMEOUT') return 'timeout'; // the parser ran out of budget (REQ-132)
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
export function recordingClient(client: AiModelClient): {
  client: AiModelClient;
  takeError: () => unknown;
} {
  let lastError: unknown;
  return {
    client: {
      async complete(request) {
        try {
          return await client.complete(request);
        } catch (error) {
          lastError = error;
          throw error;
        }
      },
    },
    takeError: () => {
      const error = lastError;
      lastError = undefined;
      return error;
    },
  };
}

/** What runCase needs: the parser call, the recorded client error and a millisecond clock. */
export interface RunCaseDeps {
  parse: EventTextParser['parse'];
  takeClientError: () => unknown;
  clock: () => number;
}

/** Runs one case `runs` times, timing, classifying and scoring each run (REQ-100, REQ-101). */
export async function runCase(
  evalCase: EvalCase,
  runs: number,
  deps: RunCaseDeps,
): Promise<CaseRuns> {
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = deps.clock();
    let outcome: ParseEventResult | { error: string };
    try {
      outcome = await deps.parse({
        text: evalCase.input.text,
        formTimezone: evalCase.input.timezone,
        now: new Date(evalCase.input.now),
      });
    } catch (error) {
      outcome = { error: error instanceof DomainError ? error.code : String(error) };
    }
    const latencyMs = deps.clock() - start;
    const status = classifyRun({ outcome, latencyMs, clientError: deps.takeClientError() });
    results.push({ status, latencyMs, result: scoreCase(evalCase, outcome) });
  }
  return aggregateRuns(evalCase, results);
}
