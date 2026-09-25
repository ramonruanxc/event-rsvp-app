/**
 * Command-line runner for the event-parser evaluation (`npm run eval -- --model <id>`).
 *
 * Runs every case `--runs` times (default 3) through `AiEventParser`, scores each run, writes the
 * Phase 8 Markdown report and exits 0 when the gate passes, 1 when it fails, and 2 when an option
 * check fails, including the chosen provider's API key not being set. Runs through
 * `--provider openrouter|anthropic` (default `openrouter`).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createAnthropicModelClient } from '@/lib/ai/anthropic-model-client';
import { createOpenRouterModelClient } from '@/lib/ai/openrouter-model-client';
import { AiEventParser } from '@/services/ai-event-parser';
import { evalCasesSchema } from './cases.schema';
import { parseEvalOptions, reportFileName, reportLabel } from './options';
import { renderEvalReport } from './report';
import { recordingClient, runCase } from './runs';
import { gateEval, summarizeEval } from './score';
import type { CaseRuns } from './types';

async function main(): Promise<void> {
  const parsed = parseEvalOptions(process.argv.slice(2), process.env);
  if ('error' in parsed) {
    console.error(parsed.error);
    process.exit(2);
  }
  const { provider, model, cases: casesPath, out: outDir, runs, reasoningEffort } = parsed;
  const cases = evalCasesSchema.parse(JSON.parse(readFileSync(casesPath, 'utf8')));

  const recorder = recordingClient(
    provider === 'openrouter'
      ? createOpenRouterModelClient({
          env: { ...process.env, OPENROUTER_REASONING_EFFORT: reasoningEffort },
        })
      : createAnthropicModelClient(),
  );
  const parser = new AiEventParser({ providers: [{ name: provider, client: recorder.client, model }] });

  const results: CaseRuns[] = [];
  for (const evalCase of cases) {
    results.push(
      await runCase(evalCase, runs, {
        parse: (request) => parser.parse(request),
        takeClientError: recorder.takeError,
        clock: () => performance.now(),
      }),
    );
  }

  const summary = summarizeEval(results);
  const date = new Date().toISOString().slice(0, 10);
  const report = renderEvalReport(summary, results, {
    model: reportLabel(provider, model),
    date,
    runs,
    reasoningEffort,
  });

  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, reportFileName(date, provider, model));
  writeFileSync(outPath, report, 'utf8');

  console.log(`overall: ${summary.all.overall}`);
  for (const category of Object.keys(summary.all.byCategory) as (keyof typeof summary.all.byCategory)[]) {
    console.log(`${category}: ${summary.all.byCategory[category].rate}`);
  }
  console.log(`availability: ${summary.stats.availability}`);
  console.log(`p95 latency ms: ${summary.stats.p95LatencyMs}`);
  console.log(`report: ${outPath}`);

  process.exit(gateEval(summary) ? 0 : 1);
}

void main();
