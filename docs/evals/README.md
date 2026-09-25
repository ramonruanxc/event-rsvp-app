# Event-parser evaluation

## OpenRouter (Phase 7)

| Provider | Model | Overall | must-not-invent | prompt-injection | Gate | USD per M tokens (in / out) |
|---|---|---|---|---|---|---|
| openrouter | openai/gpt-4o-mini | 90% | 50% | 67% | FAIL | 0.15 / 0.60 |
| openrouter | anthropic/claude-haiku-4.5 | 97% | 75% | 100% | FAIL | 1.00 / 5.00 |
| openrouter | anthropic/claude-sonnet-5 | 100% | 100% | 100% | PASS | 2.00 / 10.00 |

Estimated cost of one round (3 models × 30 cases): ≈ USD 0.14.

Key usage after the three runs: USD 0.1283 used, USD 2.8717 remaining of the USD 3 limit (measured by the
orchestrator after the three runs).

**Production models:** the production `OPENROUTER_MODEL` (OpenRouter is the default and only production provider) is
the cheapest model that passes the gate. `openai/gpt-4o-mini` fails the gate (must-not-invent 50%, prompt-injection
67%). `anthropic/claude-haiku-4.5` fails the gate (must-not-invent 75%). `anthropic/claude-sonnet-5` passes the gate
(100% overall, must-not-invent 100%, prompt-injection 100%), so it is the production choice.

No Vercel variable needed: the code default is the model chosen by this evaluation (`anthropic/claude-sonnet-5`); set `OPENROUTER_MODEL` only to override.

For Anthropic (former TASK-131), which only applies if an operator enables it with `AI_PROVIDERS`: the code default
`AI_MODEL` is `claude-sonnet-5`, since `anthropic/claude-haiku-4.5` fails the gate but `anthropic/claude-sonnet-5`
passes; set `AI_MODEL` only to override.
