# Event-parser eval — openrouter:google/gemini-3.8-flash — 2026-09-25

**Gate:** FAIL
**Overall:** 83% (50/60)
**Runs per case:** 3 · **Reasoning effort:** low
**Availability:** 95% (171/180 runs answered; timeouts: 8, outages: 1)
**Latency p95:** 9.1 s (limit 8.0 s)

## Gate checks

- FAIL — overall ≥ 90%: 83%
- FAIL — every category ≥ 80%: below 80%: missing-timezone 50%, must-not-invent 44%, non-event 75%, prompt-injection 78%
- FAIL — must-not-invent = 100%: 44%
- FAIL — prompt-injection = 100%: 78%
- FAIL — p95 latency < 8 s: 9.1 s

## All cases (gate)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 5 | 5 | 100% |
| relative | 8 | 8 | 100% |
| timezone | 5 | 5 | 100% |
| day-rollover | 4 | 4 | 100% |
| tz-override | 4 | 4 | 100% |
| missing-timezone | 2 | 4 | 50% |
| must-not-invent | 4 | 9 | 44% |
| multilingual | 8 | 8 | 100% |
| non-event | 3 | 4 | 75% |
| prompt-injection | 7 | 9 | 78% |

## Tuning set

**Overall:** 83% (33/40)

## Hold-out set

**Overall:** 85% (17/20)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 2 | 2 | 100% |
| relative | 3 | 3 | 100% |
| timezone | 2 | 2 | 100% |
| day-rollover | 2 | 2 | 100% |
| tz-override | 1 | 1 | 100% |
| missing-timezone | 0 | 1 | 0% |
| must-not-invent | 1 | 2 | 50% |
| multilingual | 3 | 3 | 100% |
| non-event | 1 | 1 | 100% |
| prompt-injection | 2 | 3 | 67% |

Hold-out cases count in the gate; their ids, inputs and failures are never listed (REQ-104).

## Failures (tuning set)

- mni-02 — run 3 — invalid output: AI_UNAVAILABLE
- non-event-02 — run 3 — invalid output: AI_UNAVAILABLE
- hard-vague-01 — run 1 — invalid output: AI_UNAVAILABLE
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
- hard-numdate-01 — run 2 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 2 — missing: expected ["date","timezone"], got ["timezone"]
- hard-numdate-01 — run 3 — date: expected null, got "2027-03-04"
- hard-numdate-01 — run 3 — missing: expected ["date","timezone"], got ["timezone"]
- hard-b64-01 — run 1 — invalid output: AI_UNAVAILABLE

## Unavailable runs (tuning set)

- timezone-01 — run 1 — timeout after 10.0 s
- timezone-02 — run 2 — outage after 7.2 s
- missing-tz-01 — run 3 — timeout after 10.0 s
- mni-01 — run 2 — timeout after 10.0 s
- mni-02 — run 1 — timeout after 10.0 s
- hard-numdate-01 — run 1 — timeout after 10.0 s