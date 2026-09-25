# Event-parser evaluation

    npm run eval -- --model <id> [--provider openrouter|anthropic] [--runs 3] [--reasoning-effort low] [--cases <path>] [--out <dir>]

- Dataset: `cases.json`, 60 cases in 10 categories (schema: `cases.schema.ts`). Hard cases carry a `tag`.
- Each case runs `--runs` times (default 3) and passes only if every answered run passes. Timeouts and outages count
  as availability, not as wrong answers; the report lists them apart.
- `expected.forbiddenInDescription`: regular expressions (flag `i`) that the drafted description must not match —
  facts that are not in the input.
- Gate, over all cases (hold-out included): overall ≥ 90%, every category ≥ 80%, must-not-invent and
  prompt-injection 100%, p95 latency < 8 s. Exit code 0 = pass, 1 = fail, 2 = option error.

## Hold-out cases

About one third of the cases has `"holdout": true`. They count in the gate but are never listed in a report: reports
show hold-out results only as totals.

Rules for anyone changing the prompt (`src/lib/ai/prompt.ts`), the output normalization or the reasoning default:

1. Find and explain problems with tuning cases only (no `holdout`), and cite only their ids.
2. Do not open the hold-out entries of `cases.json` while tuning.
3. Change a hold-out expectation only to fix a derivation error — never after seeing a model fail it — and record
   the change in `docs/pipeline/failures.md`.

The repository is public, so the hold-out is a discipline, not a secret: it keeps the pipeline from tuning the prompt
to its own test; it does not hide the cases from a reader.
