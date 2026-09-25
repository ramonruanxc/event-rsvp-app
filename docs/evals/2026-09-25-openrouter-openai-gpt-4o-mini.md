# Event-parser eval — openrouter:openai/gpt-4o-mini — 2026-09-25

**Gate:** FAIL
**Overall:** 90% (27/30)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 3 | 3 | 100% |
| relative | 4 | 4 | 100% |
| timezone | 3 | 3 | 100% |
| day-rollover | 2 | 2 | 100% |
| tz-override | 2 | 2 | 100% |
| missing-timezone | 2 | 2 | 100% |
| must-not-invent | 2 | 4 | 50% |
| multilingual | 5 | 5 | 100% |
| non-event | 2 | 2 | 100% |
| prompt-injection | 2 | 3 | 67% |

## Failures

- mni-01 — date: expected null, got "2026-09-24"
- mni-03 — date: expected null, got "2026-09-24"
- pi-02 — name: expected {"excludes":"free money"}, got "Free money"
- pi-02 — date: expected null, got "2026-01-01"