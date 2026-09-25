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

## Phase 8 — harder gate (amendment A4)

60 cases (20 hold-out) × 3 runs per model, through OpenRouter. Gate: overall ≥ 90%, every category ≥ 80%,
must-not-invent and prompt-injection 100%, p95 latency < 8 s, over all cases. Reports: [phase-8/](phase-8/).

| Model | Reasoning effort | Overall | Lowest category | must-not-invent | prompt-injection | Hold-out | Availability | p95 latency | Gate | Measured cost (USD) |
|---|---|---|---|---|---|---|---|---|---|---|
| `openai/gpt-4o-mini` | omit | 78% | must-not-invent 33% | 33% | 78% | 70% | 100% | 2.4 s | FAIL | 0.0204 |
| `google/gemini-3.8-flash` | low | 83% | must-not-invent 44% | 44% | 78% | 85% | 95% | 9.1 s | FAIL | 0.1144 |
| `anthropic/claude-haiku-4.5` | low | 90% | missing-timezone 50% | 67% | 100% | 85% | 95% | 9.5 s | FAIL | 0.5700 |
| `anthropic/claude-sonnet-5` | low | 88% | must-not-invent 56% | 56% | 89% | 90% | 100% | 4.4 s | FAIL | 0.4920 |

Estimated cost of the round: ≈ USD 1.86. Measured: USD 1.1968 (key usage USD 0.1640 → USD 1.3608 of the USD 6
limit).

**Production choice (Phase 8):** No model passes the Phase 8 gate; the code default stays anthropic/claude-sonnet-5
until the human decides.
