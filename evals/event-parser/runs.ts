import type { ParseEventResult } from '@/lib/ai/types';
import type { RunStatus } from './types';

/** Status of one run (REQ-101): a result → ok; ≥ AI_TIMEOUT_MS or a client timeout → timeout; other outage → outage; else invalid. */
export function classifyRun(_run: {
  outcome: ParseEventResult | { error: string };
  latencyMs: number;
  clientError: unknown;
}): RunStatus {
  throw new Error('not implemented');
}
