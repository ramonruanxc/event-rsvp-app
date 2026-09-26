# Event RSVP App

Create an event, share one link, see who's coming.

## Start here

**Live app:** https://event-rsvp-app-flax.vercel.app — create an account with email and password (or use Google
if you are a test user). Guests never need to sign in: the
[demo event](https://event-rsvp-app-flax.vercel.app/e/demoPicnic) takes RSVPs with no account at all.

**60-second walkthrough**

1. Open the demo event and RSVP as a guest — no sign-in required.
2. Create an account (name, email, password) — or sign in with Google.
3. Go to your dashboard and click "Create sample event" to see a seeded guest list.
4. Create your own event and try "Fill with AI" to prefill it from pasted text.
5. Copy the event's invite link, open it in a private/incognito window, RSVP there, and watch the
   organizer's guest list update.

**Read more:** [how this was built (pipeline overview)](docs/how-ai-was-used.md) ·
[failure log](docs/pipeline/failures.md) · [time report](docs/timelog.md)

## What it is

An organizer creates an event, shares one link, and sees who is coming; a guest opens the link and answers in
seconds, no account needed. Built end to end — code, tests, spec and docs — by a pipeline of Claude agents from a
human-approved specification (see [How AI was used](#how-ai-was-used)).

## Scope decisions

- **Core (phases 0–5)** — the challenge's requirements plus its listed bonuses (deploy, SSO, AI): events, RSVP,
  sharing/demo, and hardening are the requirements; a live deploy, Google sign-in, and AI fill (phase 4) are the
  bonuses built alongside them. Delivered and usable.
- **Deliberate bonuses (phases 6–7)** — added during execution, by human request: UI/UX redesign (amendment A2 —
  usability and product quality are evaluation criteria) and a second AI provider for resilience (amendment A3 —
  Anthropic credits were pending).
- **After delivery (phases 8–11)** — each triggered by a concrete signal: a harder AI eval to pick a cheaper
  model, a one-command container after a fresh-clone test, email/password sign-in so the evaluator needs no
  Google test-user access, and fixes from external feedback.
- **Stopped here** — capacity limits, password reset/email verification, and CSV export were deliberately left
  out (reasons in ["What I left out"](#what-i-left-out) below).

Cost per phase and full detail: [docs/scope-decisions.md](docs/scope-decisions.md).

## Features

### Core

- **Events** — create, edit and delete an event you own; a dashboard lists your events with RSVP counts.
- **RSVP** — guests respond without an account (name, Going / Not going, party size); duplicate names are blocked;
  a returning guest can change or cancel their own RSVP; RSVP closes once the event starts.
- **Guest list** — organizers see every RSVP with totals and can remove any of them; guest names are never shown
  to other guests.

### Bonus

- **Sign in with Google or email and password** — one account can use both; per-event roles only (Organizer for
  events you own, Guest everywhere else), no admin role.
- **AI fill** — "Fill with AI" turns pasted text into a prefilled event form, flagging fields it could not find.
- **i18n EN/FR/PT-BR** — three languages, browser-locale detection on first visit, remembered afterwards.
- **.ics** — "Add to calendar" downloads a standard file, no sign-in required.
- **Sample event** — one click fills a new organizer's empty dashboard with a ready-made event.
- **Demo** — a public, seeded event lets evaluators RSVP without creating anything.
- **Dark/light theme** — dark by default, switchable, both checked against WCAG 2.2 AA.
- **One-command local run** — `docker compose up --build`; Node is not required.

## Technical highlights

- **AI fill resolves relative dates against the organizer's own timezone and reports missing fields instead of
  guessing them** (zod-validated output, `null` for anything not stated). [src/lib/ai/prompt.ts](src/lib/ai/prompt.ts), [src/lib/ai/output.ts](src/lib/ai/output.ts).
- **Prompt-injection defenses are checked by an eval harness**, not just by eye: each case runs ×3, a third of
  cases is held out from tuning, and every category is gated separately. [evals/event-parser/score.ts](evals/event-parser/score.ts), [docs/evals/README.md](docs/evals/README.md).
- **A provider-agnostic AI client fails over between providers inside one shared time budget**, with a distinct
  error per cause (outage vs. bad output, never retried). [src/services/ai-event-parser.ts](src/services/ai-event-parser.ts), [src/lib/ai/providers-config.ts](src/lib/ai/providers-config.ts).
- **Guests edit their own RSVP with no account, via a hashed edit token in a cookie** — only the hash is ever
  stored server-side. [src/lib/edit-token-cookie.ts](src/lib/edit-token-cookie.ts), [src/services/submit-rsvp.ts](src/services/submit-rsvp.ts).
- **Duplicate-guest detection and guest-name privacy share one normalized name key**, enforced by a database
  unique constraint. [src/services/submit-rsvp.ts](src/services/submit-rsvp.ts), [src/repositories/prisma/prisma-rsvp-repository.ts](src/repositories/prisma/prisma-rsvp-repository.ts).
- **Every rate limit (RSVP, sign-in) stores a salted hash of the IP or email**, never the raw value.
  [src/lib/client-ip.ts](src/lib/client-ip.ts), [src/services/sign-in-with-password.ts](src/services/sign-in-with-password.ts).
- **Password auth compares a fixed-cost dummy hash on every failed lookup and clears a password Google's
  verification predates**, ending its sessions (closes a pre-hijacking path). [src/lib/password.ts](src/lib/password.ts), [src/services/link-google-account.ts](src/services/link-google-account.ts).
- **The one-command container generates its own `AUTH_SECRET` and always migrates → seeds → serves on start**, so
  a fresh clone with no `.env.local` works end to end. [scripts/docker/start.ts](scripts/docker/start.ts), [scripts/docker/start-plan.ts](scripts/docker/start-plan.ts).

## Run locally

### One command (Docker)

Prerequisite: Docker with Compose 2.24+. Node is not needed.

```bash
docker compose up --build
```

Open `http://localhost:3000` (demo event at `/en/e/demoPicnic`; a busy port 3000 can be changed with
`APP_PORT=3100`). The app container migrates and seeds the database, then serves the app, every time it starts.
`.env.local` is optional: without it, RSVP and email/password sign-in work fully (a session secret is generated at
each start); Google sign-in and "Fill with AI" need their own credentials (see `.env.example`). Stop with `Ctrl+C`
or `docker compose down` (`-v` also deletes the database).

### Development (Node)

Prerequisites: Node 22 (npm 10), Docker for PostgreSQL.

```bash
npm ci
docker compose up -d db
cp .env.example .env.local   # fill in the values you need — see .env.example and docs/plan.md, HUMAN-02/HUMAN-04
npx dotenv -e .env.local -- prisma migrate dev
npx dotenv -e .env.local -- prisma db seed
npm run dev
```

Serves on `http://localhost:3000` (`npm run dev -- -p 3100` if busy; set `E2E_PORT` to match for E2E). Everything
works with just the steps above except "Continue with Google" and "Fill with AI", which need their own credentials
(`.env.example` documents every variable; Google OAuth setup steps are in `docs/plan.md`, HUMAN-02).

## Tests

Unit tests need no database; integration and E2E need only the database container (`docker compose up -d db`).
Current counts: 484 unit tests, 27 integration tests, and 83 end-to-end journeys across a11y and all three
locales — all passing in CI (Node 22). `npm run trace` checks that every requirement marked "done" in
[docs/spec.md](docs/spec.md) is cited by at least one passing test.

```bash
npm run test:unit     # Vitest, no database
npm run test:int      # Vitest, Docker Postgres (rsvp_test)
npm run test:e2e      # Playwright, Docker Postgres (rsvp_test); uses E2E_PORT (default 3000)
npm run trace         # traceability check
npx tsx scripts/docker/smoke-cli.ts   # smoke check of a running docker compose stack
```

## Security

- Passwords hashed with `scrypt` (`node:crypto`, per-user salt, constant-time check); the hash is never logged or
  sent to the browser. Sessions are encrypted JWT cookies.
- Failed sign-ins are limited per email and per client IP; RSVP submissions are rate-limited per client, with only
  a salted hash of the IP ever stored; a hidden honeypot field rejects automated spam.
- Google signs in to an existing account only when Google has verified the email; linking clears a password set
  before that verification and ends the sessions it opened, which defeats account pre-hijacking.
- Known trade-off (account enumeration): registering with the email of an existing Google account says so, so the
  person knows to switch to Google sign-in — this reveals that the email has an account, and the refusal counts
  against the per-IP sign-in limit.
- Known limitation (pre-existing, documented, not fixed): `src/lib/client-ip.ts` trusts the `X-Forwarded-For` /
  `X-Real-IP` headers without a defined trusted-proxy boundary (flagged by the reviewer on PR #16).
- User content always renders as text, never raw HTML; authorization is enforced in the services, not only in the
  UI; every response carries `X-Frame-Options`, `Referrer-Policy` and `X-Content-Type-Options`.

## How AI was used

- The app was built end to end by a pipeline of Claude agents (analyst, spec-writer, implementer, reviewer) from a
  human-approved spec, each gated by tests and an adversarial review before merge.
- A traceability chain (business rule → requirement → task → test) keeps the spec and the code in sync; a CI check
  fails the build if it ever breaks.
- Failures escalate upstream — implementation issues to the implementer, repeated ones to the spec, spec gaps to
  the documentation — instead of retrying on a stronger model; every escalation is logged.
- "Fill with AI" (the product feature) is scored against a 60-case quiz before a model is trusted as the default.
- Full mechanics, the agent roster, and every incident: [docs/how-ai-was-used.md](docs/how-ai-was-used.md).

## What I verified by hand

- Google sign-in end to end in production (2026-09-24).
- The production setup (Vercel, Neon, Google OAuth, stable public domain https://event-rsvp-app-flax.vercel.app).
- The approved visual direction (mockup) and every business-rule decision raised as a DOC question during the
  pipeline.
- The real AI evaluation results (three models via OpenRouter) and the decision that the code default follows
  them.
- The key handling: the OpenRouter key was provisioned with a spend limit and never printed.
- "Fill with AI" in production with seven hand-picked cases (English, French and Portuguese input, a missing time,
  an explicit timezone, non-event text and a prompt-injection attempt): all seven behaved as expected (2026-09-25).
- The one-command local run on a fresh clone with no `.env.local` (`docker compose up --build`): registered with
  email and password, signed out and signed in again (2026-09-25).

Agent-run smoke tests and fresh-clone verifications are recorded separately, with their actor, in the
[timelog Events table](docs/timelog.md).

## What I left out

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
| Password reset | Needs email sending, which is out of scope. A user who forgets a password can sign in with Google (same email) and set a new one in Account. |
| Email verification | Needs email sending; registration signs in at once. Because the email is not verified, a later Google sign-in with that email removes the password (see Security). |
| Ending other sessions after a password change | Sessions are JWTs with no server-side store; only the Google-link password removal ends password sessions. |
| Publishing the Google OAuth app (stays in Testing mode) | Google requires full branding (home page, privacy policy, verified authorized domain) to publish an External OAuth app, and `vercel.app` ownership cannot be proven; the evaluator's Google account is added as a test user instead. Evaluators can also register with email and password. |
| Upgrading Next 15 → 16 and Vitest 3 → 4+ | Six Dependabot alerts (postcss pinned inside next@15; vitest dev-only) are not exploitable here: postcss only runs at build time on first-party CSS and vitest never ships. Both need major upgrades, out of scope for this exercise; alerts were dismissed as tolerable risk with this reasoning. |

Full detail, including the brief citations, is in the
["Out of scope" section of docs/business-rules.md](docs/business-rules.md#out-of-scope).

## Time report

| | Time |
|---|---|
| Wall clock (timer: 2026-09-24 12:06 → 2026-09-25 10:17, America/Fortaleza) | 22h 11m |
| Paused (6 announced pauses: breaks, calls, sleep) | 13h 03m |
| **Human active time (self-reported)** | **3h 30m** |
| Agent run time (sum of all agent runs; many ran in parallel and during pauses) | 13h 48m |

Post-delivery, after the timer above closed, phases 9 (containerize) and 10 (email/password sign-in) ran
agent-only, no human task; human active time is unchanged. Full breakdown, including every phase, pause and agent
run: [docs/timelog.md](docs/timelog.md).

## Want to know more?

| Topic | File |
|---|---|
| Business rules and glossary | [docs/business-rules.md](docs/business-rules.md) |
| Scope decisions (cost per phase, what was stopped) | [docs/scope-decisions.md](docs/scope-decisions.md) |
| Specification (requirements) | [docs/spec.md](docs/spec.md) |
| Implementation plan (tasks) | [docs/plan.md](docs/plan.md) |
| Product brief | [docs/PRODUCT.md](docs/PRODUCT.md) |
| Architecture and stack | [docs/architecture.md](docs/architecture.md) |
| Design system | [docs/DESIGN.md](docs/DESIGN.md) |
| Architecture / flow diagrams | [docs/diagrams/README.md](docs/diagrams/README.md) |
| How AI was used (pipeline, agents, evidence) | [docs/how-ai-was-used.md](docs/how-ai-was-used.md) |
| Pipeline playbook (agent instructions) | [.claude/skills/pipeline/SKILL.md](.claude/skills/pipeline/SKILL.md) |
| Failure log | [docs/pipeline/failures.md](docs/pipeline/failures.md) |
| Timelog / time report | [docs/timelog.md](docs/timelog.md) |
| AI evaluation ("Fill with AI" model choice) | [docs/evals/README.md](docs/evals/README.md) |
