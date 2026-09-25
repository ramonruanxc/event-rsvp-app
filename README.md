# Event RSVP App

Create an event, share one link, see who's coming.

## Live demo

**Production URL:** https://event-rsvp-app-flax.vercel.app

**Demo event (no sign-in needed):** https://event-rsvp-app-flax.vercel.app/e/demoPicnic

> Google sign-in runs in Testing mode: an evaluator's Google account must be added as a test user. Guests never
> need to sign in.

## 60-second walkthrough

1. Open the demo event and RSVP as a guest — no sign-in required.
2. Sign in with Google.
3. Go to your dashboard and click "Create sample event" to see a seeded guest list.
4. Create your own event and try "Fill with AI" to prefill it from pasted text.
5. Copy the event's invite link, open it in a private/incognito window, RSVP there, and watch the
   organizer's guest list update.

## Features

### Core

- **Events** — create, edit and delete an event you own (name, description, date/time, timezone, optional
  location); a dashboard lists your upcoming and past events with RSVP counts.
- **RSVP** — guests respond from the event page without an account (name, Going / Not going, party size); a
  returning guest (same browser) sees and can change or cancel their own RSVP; duplicate names on the same
  event are blocked; RSVP submission and editing close once the event starts.
- **Guest list** — organizers see every RSVP on their event with totals, and can remove any RSVP, including
  after the event has ended; guest names are never exposed to other guests.

### Bonus

- **Google SSO with per-event roles** — sign in with Google; there is no admin role, only Organizer (for the
  events you own) and Guest (everywhere else).
- **AI fill** — "Fill with AI" turns pasted text into a prefilled event form, flagging any field it could not
  find for the organizer to complete.
- **i18n EN/FR/PT-BR** — three interface languages with a language switcher, browser-locale detection on first
  visit, and a remembered choice afterwards.
- **.ics** — "Add to calendar" downloads a standard `.ics` file from the guest and owner event pages, no
  sign-in required.
- **Sample event** — "Create sample event" fills a new organizer's empty dashboard with a ready-made event and
  sample RSVPs.
- **Demo** — a public demo event, seeded and kept open automatically, lets evaluators RSVP without creating
  anything.
- **Dark/light theme with WCAG 2.2 AA checks** — dark theme by default, switchable from the header; automated
  contrast and focus-ring checks guard both themes.

### Security and abuse protection

- RSVP submissions are rate-limited to 10 per 10 minutes per client; only a salted hash of the IP is stored.
- A hidden honeypot field rejects automated spam submissions without revealing why.
- Every response carries `X-Frame-Options`, `Referrer-Policy` and `X-Content-Type-Options` headers.
- User content always renders as text (no raw HTML); authorization is enforced in the services, not only in the UI.

## Architecture

Layered folders, each with one responsibility:

| Folder | Responsibility |
|---|---|
| `src/domain` | Pure business rules and types: validation, time/timezone handling, slugs, policies, totals — no I/O. |
| `src/services` | Use cases (create/update/delete an event, submit/cancel/remove an RSVP, AI parsing, rate limiting) that orchestrate the domain and repositories. |
| `src/repositories` | Data access behind interfaces, with a Prisma implementation and an in-memory one for tests. |
| `src/lib` | Cross-cutting helpers: auth, crypto, cookies, IP hashing, `.ics` generation, theme, contrast, the AI client. |
| `src/app` | Next.js routes, pages, layouts and Server Actions — thin controllers that call one service and map its result. |

Diagrams: [agent pipeline](docs/diagrams/agent-pipeline.svg), [user flows](docs/diagrams/user-flows.svg),
[AI event parsing](docs/diagrams/ai-event-parsing.svg) (source and regeneration instructions in
[docs/diagrams/README.md](docs/diagrams/README.md)).

## Business rules and specification

- **Business rules:** [docs/business-rules.md](docs/business-rules.md)
- **Specification (requirements):** [docs/spec.md](docs/spec.md)
- **Implementation plan (tasks):** [docs/plan.md](docs/plan.md)
- **Product brief:** [docs/PRODUCT.md](docs/PRODUCT.md)
- **Design system:** [docs/DESIGN.md](docs/DESIGN.md)

## Run locally

Prerequisites: Node 22, Docker.

```bash
docker compose up -d
cp .env.example .env.local   # then fill in the values (see docs/plan.md, HUMAN-04)
npx dotenv -e .env.local -- prisma migrate dev
npx dotenv -e .env.local -- prisma db seed
npm run dev
```

- AI: set `OPENROUTER_API_KEY` in `.env.local` (`npm run openrouter:key` creates the OpenRouter key with a USD 3 spend
  limit from the system variable `OPENROUTER_MANAGMENT_KEY` and writes it there). OpenRouter is the default and only
  provider (`AI_PROVIDERS` defaults to `openrouter`; `OPENROUTER_MODEL` defaults to `anthropic/claude-sonnet-5`, the
  model chosen by the [evaluation](docs/evals/README.md)). Anthropic is optional: to use it, set `ANTHROPIC_API_KEY` and
  list it in `AI_PROVIDERS`, e.g. `AI_PROVIDERS=openrouter,anthropic` — providers are tried in the listed order and
  failover needs more than one. A listed provider without a key is skipped; with no key "Fill with AI" shows its
  fallback message and the manual form still works.

The app serves on `http://localhost:3000`. If port 3000 is already in use, set `E2E_PORT` and run
`npm run dev -- -p 3100` instead.

## Tests

```bash
npm run test:unit     # Vitest, no database — domain, services and components in isolation
npm run test:int      # Vitest, Docker Postgres (rsvp_test) — repositories and Server Actions against a real database
npm run test:e2e      # Playwright, Docker Postgres (rsvp_test) — full user journeys in a browser; uses E2E_PORT (default 3000)
npm run trace         # traceability check: every done requirement is cited by a passing test
```

## AI evaluation

"Fill with AI" is scored against a fixed 30-case quiz (accuracy, must-not-invent and prompt-injection resistance) by
the runner in [evals/event-parser](evals/event-parser). The gate is at least 90% overall and 100% on
must-not-invent and prompt-injection.

| Model (via OpenRouter) | Overall | Must not invent | Prompt injection | Gate |
|---|---|---|---|---|
| `openai/gpt-4o-mini` | 90% | 50% | 67% | Fail |
| `anthropic/claude-haiku-4.5` | 97% | 75% | 100% | Fail |
| `anthropic/claude-sonnet-5` | 100% | 100% | 100% | **Pass** |

Production uses the cheapest model that passes the gate: `anthropic/claude-sonnet-5` (the code default). The
cheaper models invented dates or times the text did not contain. Measured cost of the three runs: USD 0.13. Full
reports: [docs/evals/README.md](docs/evals/README.md).

```bash
npm run eval -- --model anthropic/claude-sonnet-5                # OpenRouter (default), needs OPENROUTER_API_KEY
npm run eval -- --provider anthropic --model claude-sonnet-5     # Anthropic (optional), needs ANTHROPIC_API_KEY
```

## How I used AI

The whole app was built by a pipeline of Claude agents (analyst, spec-writer, implementer, reviewer) working
from a human-approved spec, each gated by tests and a reviewer before merge — see
[docs/diagrams/agent-pipeline.svg](docs/diagrams/agent-pipeline.svg) for the escalation path (execution →
specification → documentation) and which model ran which stage.

Failures the pipeline hit along the way, and their root causes, are logged in
[docs/pipeline/failures.md](docs/pipeline/failures.md).

What I verified by hand:

- Google sign-in end to end in production (2026-09-24).
- The production domain (https://event-rsvp-app-flax.vercel.app), its public access, and smoke tests of the live site
  after the phase 1, 3, 6 and 7 deployments (locales, demo event, `.ics`, sign-in redirect, theme, security headers;
  see the Events table in [docs/timelog.md](docs/timelog.md)).
- The approved visual direction (mockup) and every business-rule decision raised as a DOC question during the
  pipeline.
- The real AI evaluation results (three models via OpenRouter) and the decision that the code default follows
  them.
- The key handling: the OpenRouter key was provisioned with a spend limit and never printed.
- "Fill with AI" in production with seven hand-picked cases (English, French and Portuguese input, a missing time,
  an explicit timezone, non-event text and a prompt-injection attempt): all seven behaved as expected (2026-09-25).

## What I left out and why

| Item | Reason |
|---|---|
| Capacity limits on RSVPs | Explicitly decided: "No capacity limit" (design brief). |
| Email notifications | Explicitly decided: guests are not notified of date changes because "email out of scope" (design brief). |
| "Maybe" RSVP response | Response is limited to Going / Not going by design; no reason given beyond the decision itself. |
| CSV export | Listed in the brief's out-of-scope list; no reason given in the brief. |
| Admin role | Listed in the brief's out-of-scope list; consistent with roles being only Organizer/Guest, contextual per event. |
| Multiple organizers per event | Listed in the brief's out-of-scope list; consistent with the data model's single owner per event. |
| Cross-device RSVP editing for guests | Listed in the brief's out-of-scope list, and stated directly as unsupported. |
| Strict CSP | Listed in the brief's out-of-scope list; other XSS mitigations are used instead (React escaping only, no `dangerouslySetInnerHTML`). |
| Observability beyond logs | Listed in the brief's out-of-scope list; no reason given in the brief. |
| Per-PR preview deployments | Explicitly decided: "no per-PR previews (would migrate the production database)". |
| Publishing the Google OAuth app (stays in Testing mode) | Google requires full branding (home page, privacy policy, verified authorized domain) to publish an External OAuth app, and `vercel.app` ownership cannot be proven; the evaluator's Google account is added as a test user instead. |
| Upgrading Next 15 → 16 and Vitest 3 → 4+ | Six Dependabot alerts (postcss pinned inside next@15; vitest dev-only) are not exploitable here: postcss only runs at build time on first-party CSS and vitest never ships. Both need major upgrades, out of scope for this exercise; alerts were dismissed as tolerable risk with this reasoning. |

Full detail, including the brief citations, is in the
["Out of scope" section of docs/business-rules.md](docs/business-rules.md#out-of-scope).

## Time report

Timer: 2026-09-24 12:06:04 → 2026-09-25 10:17:22 (America/Fortaleza). Phase 0 (comprehension, 25 min) is untimed.

| | Time |
|---|---|
| Wall clock | 22h 11m |
| Paused (6 pauses: breaks, work calls, sleep) | 13h 03m |
| **Human active time (self-reported)** | **3h 30m** |
| Timer minus announced pauses | 9h 07m |
| Agent run time (sum of all agent runs; many ran in parallel and during pauses) | 13h 48m |

The timer only subtracts pauses the human announced. While agents ran for long stretches, the human was often
not at the keyboard without announcing it, so the timer overstates hands-on time; the human's own measurement of
active work is **3h 30m**.

| Phase | Wall clock | Timer minus announced pauses |
|---|---|---|
| 1 — Spec definition | 1h 29m | 0h 50m |
| 2 — Pipeline bootstrap + spec | 1h 14m | 0h 39m |
| 4 — Execution, review, merges | 11h 36m | 7h 30m |
| 6 — Ship | 0h 07m | 0h 07m |

Full breakdown, including per-phase agent runs and every pause: [docs/timelog.md](docs/timelog.md).
