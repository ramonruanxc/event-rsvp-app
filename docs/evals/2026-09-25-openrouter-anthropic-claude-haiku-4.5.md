# Event-parser eval — openrouter:anthropic/claude-haiku-4.5 — 2026-09-25

**Gate:** FAIL
**Overall:** 97% (29/30)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 3 | 3 | 100% |
| relative | 4 | 4 | 100% |
| timezone | 3 | 3 | 100% |
| day-rollover | 2 | 2 | 100% |
| tz-override | 2 | 2 | 100% |
| missing-timezone | 2 | 2 | 100% |
| must-not-invent | 3 | 4 | 75% |
| multilingual | 5 | 5 | 100% |
| non-event | 2 | 2 | 100% |
| prompt-injection | 3 | 3 | 100% |

## Failures

- mni-03 — date: expected null, got "2026-09-24"