# Scope decisions

Detail behind the README's "Scope decisions" section: what was built in each layer, why, and its cost. Wall clock
and agent run time are derived from timestamps recorded in [docs/timelog.md](timelog.md) (the Phases and Events
tables for start/end, the Agent runs table for run durations); see that file for pauses and per-run detail.

## Core — the challenge's own requirements (phases 0–5)

Delivered and usable end to end.

| Phase | What shipped | Wall clock | Agent run time |
|---|---|---|---|
| 0 — Walking skeleton | Scaffold, tooling, CI, first TDD behavior, live URL | 1h 22m | 1h 10m |
| 1 — Events core | Domain, all repositories, event create/edit/delete, dashboard | 1h 47m | 1h 52m |
| 2 — RSVP flow | Guest RSVP with no account, edit/cancel their own, duplicate names blocked, RSVP closes at start | 57m | 56m |
| 3 — Sharing & demo | Sample event, invite link, `.ics`, home page, seeded demo event | 34m | 37m |
| 4 — AI event creation | "Fill with AI", rate limiter, eval runner and cases | 3h 47m | 3h 48m |
| 5 — Hardening | RSVP rate limit, honeypot, security headers, XSS check | not separately recorded — built in a parallel worktree, merged together with phase 6 | — |

Internationalization (EN/FR/PT-BR, browser-locale detection) was part of the original design brief, decided during
spec definition (phase 1 of the human/agent workflow, before any execution) — see
[business-rules.md](business-rules.md) and the design brief's design section. It is not a phase 6 addition; phase 6
below is the visual redesign, theme switch and logo only.

## Deliberate bonuses — added during execution by human request (phases 6–7)

Both came from amendments to the design brief, made and approved while phases 0–5 were being built, not from the
original plan.

| Phase | What shipped | Why (amendment) | Wall clock | Agent run time* |
|---|---|---|---|---|
| 6 — UI/UX | Visual redesign, dark/light theme switch, logo | Amendment A2, 2026-09-24: usability and product quality are evaluation criteria; the app was unstyled | 4h 07m | 5h 37m |
| 7 — AI provider resilience | Second AI provider (OpenRouter) with failover, alongside Anthropic | Amendment A3, 2026-09-24: OpenRouter credits were available and Anthropic credits were pending; a second provider adds resilience and a cost comparison | 2h 52m | 4h 46m |

\* Agent run time exceeds wall clock because independent agents ran in parallel git worktrees.

Full wording and every other amendment: the
[design brief's amendments table](design/2026-09-24-design-brief.md#amendments).

## After delivery — each triggered by a concrete, later signal (phases 8–11)

| Phase | What shipped | Trigger | Wall clock | Agent run time |
|---|---|---|---|---|
| 8 — Harder AI eval | Stricter eval gate (each case run ×3, a held-out case set, a per-category minimum) + reasoning control | The existing eval was saturated at 100%; a harder eval was needed to measure and pick a cheaper model | 2h 46m | 46m (eval run) |
| 9 — Containerize | `docker compose up --build`: one command, no Node install | A fresh-clone test surfaced friction (missing step, obsolete command, undocumented requirement) | 54m | 50m |
| 10 — Email/password sign-in | Register, sign in, Account page, Google-account linking rules | The evaluator needs no Google test-user access to sign in | 2h 43m | 2h 12m |
| 11 — Feedback fixes | Date/time pickers reachable again, one clear reason per AI-fill failure | Fixes from external reviewer feedback | 1h 09m | 1h 02m |

Human active time was self-reported only for phases 1–6 (3h 30m total) and was not tracked after delivery — but the
human kept approving amendments, making decisions and hand-verifying results through phases 8–11 (registering with
a password on a fresh local container, confirming merges, relaying reviewer feedback); see the actor "Human" in the
[timelog's Events table](timelog.md#events).

## Stopped here

Three things deliberately not built:

- Capacity limits on RSVPs — explicitly decided out of scope ("No capacity limit").
- Password reset and email verification — both need email sending, which is out of scope; signing in with Google
  on the same email is the documented workaround.
- CSV export — listed in the brief's out-of-scope list.

Full list and reasons: the README's ["What I left out"](../README.md#what-i-left-out) table and
[business-rules.md § Out of scope](business-rules.md#out-of-scope).
