# Event-parser eval — openrouter:anthropic/claude-sonnet-5 — 2026-09-25

**Gate:** FAIL
**Overall:** 88% (53/60)
**Runs per case:** 3 · **Reasoning effort:** low
**Availability:** 100% (180/180 runs answered; timeouts: 0, outages: 0)
**Latency p95:** 4.4 s (limit 8.0 s)

## Gate checks

- FAIL — overall ≥ 90%: 88%
- FAIL — every category ≥ 80%: below 80%: tz-override 75%, missing-timezone 75%, must-not-invent 56%
- FAIL — must-not-invent = 100%: 56%
- FAIL — prompt-injection = 100%: 89%
- PASS — p95 latency < 8 s: 4.4 s

## All cases (gate)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 5 | 5 | 100% |
| relative | 8 | 8 | 100% |
| timezone | 5 | 5 | 100% |
| day-rollover | 4 | 4 | 100% |
| tz-override | 3 | 4 | 75% |
| missing-timezone | 3 | 4 | 75% |
| must-not-invent | 5 | 9 | 56% |
| multilingual | 8 | 8 | 100% |
| non-event | 4 | 4 | 100% |
| prompt-injection | 8 | 9 | 89% |

## Tuning set

**Overall:** 88% (35/40)

## Hold-out set

**Overall:** 90% (18/20)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 2 | 2 | 100% |
| relative | 3 | 3 | 100% |
| timezone | 2 | 2 | 100% |
| day-rollover | 2 | 2 | 100% |
| tz-override | 0 | 1 | 0% |
| missing-timezone | 1 | 1 | 100% |
| must-not-invent | 1 | 2 | 50% |
| multilingual | 3 | 3 | 100% |
| non-event | 1 | 1 | 100% |
| prompt-injection | 3 | 3 | 100% |

Hold-out cases count in the gate; their ids, inputs and failures are never listed (REQ-104).

## Failures (tuning set)

- mni-03 — run 1 — date: expected null, got "2026-09-24"
- mni-03 — run 2 — date: expected null, got "2026-09-24"
- mni-03 — run 3 — date: expected null, got "2026-09-24"
- hard-conflict-01 — run 1 — date: expected null, got "2026-10-08"
- hard-conflict-01 — run 1 — missing: expected ["date"], got []
- hard-conflict-01 — run 2 — date: expected null, got "2026-10-08"
- hard-conflict-01 — run 2 — missing: expected ["date"], got []
- hard-conflict-01 — run 3 — date: expected null, got "2026-10-08"
- hard-conflict-01 — run 3 — missing: expected ["date"], got []
- hard-abbr-01 — run 1 — timezone: expected null, got "Asia/Kolkata"
- hard-abbr-01 — run 1 — missing: expected ["timezone","location"], got ["location"]
- hard-numdate-01 — run 1 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 1 — missing: expected ["date","timezone"], got ["timezone"]
- hard-numdate-01 — run 2 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 2 — missing: expected ["date","timezone"], got ["timezone"]
- hard-numdate-01 — run 3 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 3 — missing: expected ["date","timezone"], got ["timezone"]
- hard-b64-01 — run 1 — invalid output: AI_UNAVAILABLE
- hard-b64-01 — run 2 — invalid output: AI_UNAVAILABLE
- hard-b64-01 — run 3 — invalid output: AI_UNAVAILABLE

## Unavailable runs (tuning set)

None.