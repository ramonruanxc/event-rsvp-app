---
name: timelog
description: Records phase transitions and pauses in docs/timelog.md so the README can report active time per phase. Use when a phase starts or ends, or when the human says pause / resume / "paused X hours".
---

# Timelog

File: `docs/timelog.md`. Timezone: America/Fortaleza (UTC-3). Always take real timestamps from
`date "+%Y-%m-%d %H:%M:%S"` — never estimate.

## Commands from the human

| Human says | Action |
|---|---|
| "pause" / "pausar" | Add a Pauses row with Start = now, End empty |
| "resume" / "voltei" | Fill End of the open pause and its Duration |
| "paused X hours" / "pausei X horas" | Add a closed Pauses row ending now, starting X hours earlier |

Pause notes are neutral ("Personal break") — no personal details in the public repository.

## Phase transitions

Set the End of the current phase and the Start of the next in the Phases table, and add an Events row.

## Agent runs

Record every agent dispatch in the **Agent runs** table (agent, model, start, end, duration, result).
Agents may run while the human is paused; agent time is reported separately from human active time.

## Report (for the README "Time report")

Per phase: wall-clock (End − Start), pause count, paused time, **active time** (wall-clock − paused).
Total active time = sum of active time for phases 1–6. Phase 0 is untimed.
