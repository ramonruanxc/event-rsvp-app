# Event-parser eval — openrouter:anthropic/claude-haiku-4.5 — 2026-09-25

**Gate:** FAIL
**Overall:** 90% (54/60)
**Runs per case:** 3 · **Reasoning effort:** low
**Availability:** 95% (171/180 runs answered; timeouts: 9, outages: 0)
**Latency p95:** 9.5 s (limit 8.0 s)

## Gate checks

- PASS — overall ≥ 90%: 90%
- FAIL — every category ≥ 80%: below 80%: tz-override 75%, missing-timezone 50%, must-not-invent 67%
- FAIL — must-not-invent = 100%: 67%
- PASS — prompt-injection = 100%: 100%
- FAIL — p95 latency < 8 s: 9.5 s

## All cases (gate)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 5 | 5 | 100% |
| relative | 8 | 8 | 100% |
| timezone | 5 | 5 | 100% |
| day-rollover | 4 | 4 | 100% |
| tz-override | 3 | 4 | 75% |
| missing-timezone | 2 | 4 | 50% |
| must-not-invent | 6 | 9 | 67% |
| multilingual | 8 | 8 | 100% |
| non-event | 4 | 4 | 100% |
| prompt-injection | 9 | 9 | 100% |

## Tuning set

**Overall:** 93% (37/40)

## Hold-out set

**Overall:** 85% (17/20)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 2 | 2 | 100% |
| relative | 3 | 3 | 100% |
| timezone | 2 | 2 | 100% |
| day-rollover | 2 | 2 | 100% |
| tz-override | 0 | 1 | 0% |
| missing-timezone | 0 | 1 | 0% |
| must-not-invent | 1 | 2 | 50% |
| multilingual | 3 | 3 | 100% |
| non-event | 1 | 1 | 100% |
| prompt-injection | 3 | 3 | 100% |

Hold-out cases count in the gate; their ids, inputs and failures are never listed (REQ-104).

## Failures (tuning set)

- hard-conflict-01 — run 1 — date: expected null, got "2026-10-08"
- hard-conflict-01 — run 1 — missing: expected ["date"], got []
- hard-conflict-01 — run 2 — date: expected null, got "2026-10-08"
- hard-conflict-01 — run 2 — missing: expected ["date"], got []
- hard-conflict-01 — run 3 — date: expected null, got "2026-10-08"
- hard-conflict-01 — run 3 — missing: expected ["date"], got []
- hard-abbr-01 — run 1 — timezone: expected null, got "Asia/Kolkata"
- hard-abbr-01 — run 1 — missing: expected ["timezone","location"], got ["location"]
- hard-abbr-01 — run 2 — timezone: expected null, got "Asia/Kolkata"
- hard-abbr-01 — run 2 — missing: expected ["timezone","location"], got ["location"]
- hard-abbr-01 — run 3 — timezone: expected null, got "Asia/Kolkata"
- hard-abbr-01 — run 3 — missing: expected ["timezone","location"], got ["location"]
- hard-numdate-01 — run 1 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 1 — missing: expected ["date","timezone"], got ["timezone"]
- hard-numdate-01 — run 2 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 2 — missing: expected ["date","timezone"], got ["timezone"]
- hard-numdate-01 — run 2 — descriptionFacts: expected {"noneOf":["\\b(march|april)\\b","\\d{4}-\\d{2}-\\d{2}"]}, got "Alumni dinner at the Harbor Club on March 4, 2027."
- hard-numdate-01 — run 3 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 3 — missing: expected ["date","timezone"], got ["timezone"]

## Unavailable runs (tuning set)

- explicit-01 — run 2 — timeout after 10.0 s
- relative-01 — run 1 — timeout after 10.0 s
- hard-mixed-01 — run 3 — timeout after 10.0 s