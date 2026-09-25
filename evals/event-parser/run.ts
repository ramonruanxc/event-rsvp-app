/**
 * Command-line runner for the event-parser evaluation (`npm run eval -- --model <id>`).
 *
 * Runs every case in the dataset through `AiEventParser` with a given model, scores the
 * results, writes a Markdown report and exits 0 when the release gate passes, 1 when it
 * fails, and 2 when `ANTHROPIC_API_KEY` is not set.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { DomainError } from '@/domain/errors';
import { createAnthropicModelClient } from '@/lib/ai/anthropic-model-client';
import type { ParseEventResult } from '@/lib/ai/types';
import { AiEventParser } from '@/services/ai-event-parser';
import { evalCasesSchema } from './cases.schema';
import { gate, scoreCase, summarize } from './score';
import { renderReport } from './report';
import type { CaseResult } from './types';

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set — ask the human to provide it.');
    process.exit(2);
  }

  const { values } = parseArgs({
    options: {
      model: { type: 'string' },
      cases: { type: 'string', default: 'evals/event-parser/cases.json' },
      out: { type: 'string', default: 'docs/evals' },
    },
  });

  if (!values.model) {
    console.error('--model is required');
    process.exit(2);
  }
  const model = values.model;
  const casesPath = values.cases as string;
  const outDir = values.out as string;

  const raw = JSON.parse(readFileSync(casesPath, 'utf8'));
  const cases = evalCasesSchema.parse(raw);

  const parser = new AiEventParser({
    providers: [{ name: 'anthropic', client: createAnthropicModelClient(), model }],
  });

  const results: CaseResult[] = [];
  for (const evalCase of cases) {
    let outcome: ParseEventResult | { error: string };
    try {
      outcome = await parser.parse({
        text: evalCase.input.text,
        formTimezone: evalCase.input.timezone,
        now: new Date(evalCase.input.now),
      });
    } catch (error) {
      outcome = { error: error instanceof DomainError ? error.code : String(error) };
    }
    results.push(scoreCase(evalCase, outcome));
  }

  const summary = summarize(results);
  const date = new Date().toISOString().slice(0, 10);
  const report = renderReport(summary, results, { model, date });

  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${date}-${model}.md`);
  writeFileSync(outPath, report, 'utf8');

  console.log(`overall: ${summary.overall}`);
  for (const category of Object.keys(summary.byCategory) as (keyof typeof summary.byCategory)[]) {
    console.log(`${category}: ${summary.byCategory[category].rate}`);
  }
  console.log(`report: ${outPath}`);

  process.exit(gate(summary) ? 0 : 1);
}

void main();
