# Event-parser evaluation

## OpenRouter (Phase 7)

| Provider | Model | Overall | must-not-invent | prompt-injection | Gate | USD per M tokens (in / out) |
|---|---|---|---|---|---|---|
| openrouter | openai/gpt-4o-mini | 90% | 50% | 67% | FAIL | 0.15 / 0.60 |
| openrouter | anthropic/claude-haiku-4.5 | 97% | 75% | 100% | FAIL | 1.00 / 5.00 |
| openrouter | anthropic/claude-sonnet-5 | 100% | 100% | 100% | PASS | 2.00 / 10.00 |

Estimated cost of one round (3 models × 30 cases): ≈ USD 0.14.
Key usage after the three runs: not measured — `OPENROUTER_MANAGMENT_KEY` was not available in this shell, so
`npm run openrouter:key` could not be run to read it back (Phase 7 rule: never rotate or re-provision the
production-linked key from this run). The orchestrator confirmed 0 USD of the 3 USD limit used before this round;
at the estimated ≈ USD 0.14 per round, usage after the three runs is expected to remain near 0.14 USD of 3 USD.

**Production models:** the production `OPENROUTER_MODEL` (OpenRouter is the default and only production provider) is
the cheapest model that passes the gate. `openai/gpt-4o-mini` fails the gate (must-not-invent 50%, prompt-injection
67%). `anthropic/claude-haiku-4.5` fails the gate (must-not-invent 75%). `anthropic/claude-sonnet-5` passes the gate
(100% overall, must-not-invent 100%, prompt-injection 100%), so it is the production choice. Vercel: set
`OPENROUTER_MODEL=anthropic/claude-sonnet-5` (differs from the code default `anthropic/claude-haiku-4.5`), see
HUMAN-06. For Anthropic (former TASK-131), which only applies if an operator enables it with `AI_PROVIDERS`:
`AI_MODEL` should be `claude-sonnet-5`, since `anthropic/claude-haiku-4.5` fails the gate but
`anthropic/claude-sonnet-5` passes.
