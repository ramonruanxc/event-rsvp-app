# Design Brief — Event RSVP App

- **Date:** 2026-09-24
- **Status:** Approved (design sections 1–5)
- **Author:** Ramon Ruan, with Claude (Opus) in a brainstorming session
- **Purpose of this document:** validated input for the pipeline. The `analyst` derives `docs/business-rules.md` from it;
  the `spec-writer` derives `docs/spec.md` and `docs/plan.md` from the business rules and this brief.

---

## 1. Context

Take-home exercise ("Valsoft Agentic Coding Challenge — Event RSVP App") for a Senior Software Developer — AI Agents &
Systems Design role. The evaluator values **scope judgment over volume** and expects AI to be used throughout the
development process (plan → implement → adversarial self-review → peer review).

### Challenge statement (verbatim summary)
- Minimum: event creation (name, date, time, description); RSVP form (name + guest count); guest list.
- Requirements: working product, any stack, source on GitHub, README explaining how to run it.
- Bonus: deploy with a live URL; authentication with SSO and roles/permissions; AI features; extra creative features.
- Evaluation: Completeness, Creativity, Product Quality, Usability.

### Goals
1. Deliver the minimum features complete and tested.
2. Deliver a few bonuses done well rather than many done shallowly.
3. Make the **agentic development process visible in the repository** (docs, PRs, reviews, failure log, time report).

### Success criteria
- An evaluator opens the live URL, creates an event, RSVPs, and sees the guest list in under 2 minutes.
- An evaluator understands the process by reading the repository in under 5 minutes.
- Every requirement is traceable: business rule → requirement → task → test.

### Principle
**Maximum with minimum.** Everything left out is listed with a one-line reason in the README.

---

## 2. Product decisions

### Actors and roles
- **Organizer** — signs in with Google. Creates and manages their own events.
- **Guest** — anonymous, no account. RSVPs through an invite link.
- Roles are **contextual, derived per event**: the event owner is its Organizer; everyone else is a Guest for that
  event. No role column. Authorization rules live in one place (`domain/policies.ts`).

### Events
- Fields: name (required, ≤ 120), description (**required**, ≤ 2000, may be short), date + time (required),
  timezone (required, IANA), location (optional).
- Date/time is entered in the event's timezone, stored as UTC instant + IANA timezone, and always displayed in the
  event's timezone with its label (e.g. "7:00 PM EDT").
- The timezone field is prefilled from the browser (`Intl`) and editable (organizer may be in a different timezone
  than the event).
- Creation date/time cannot be in the past.
- Only the owner can edit or delete. Delete asks for confirmation and removes the event's RSVPs.
- Date changes after RSVPs are allowed; guests are not notified (email out of scope).
- No end time. Calendar export uses a 2-hour default duration.
- Event URLs use a random slug (nanoid, 10 chars) to prevent enumeration.

### RSVPs
- Fields: name (1–80), response (**Going** / **Not going**; no "Maybe"), party size.
- Party size = total people **including the guest**, 1–10. Label: "How many people, including you?". Not going = 0.
- On submit, the server issues an edit token (32 random bytes). Only its SHA-256 hash is stored. The raw token goes in an
  httpOnly, Secure, SameSite=Lax cookie scoped to the event path, valid until 30 days after the event.
- Returning in the same browser shows "You're going (N) · Change · Cancel". **Cancel sets the response to Not going**
  (the organizer wants to know who declined); it does not delete.
- Duplicate names within an event (case-insensitive, trimmed): same browser → becomes an edit of the existing RSVP;
  different browser → blocked with "This name is already on the list. Use a different name or ask the organizer."
  Enforced by a database unique constraint on (eventId, nameKey).
- RSVPs close when the event start time has passed; the page shows "This event has ended" (read-only).
- Editing an RSVP from a different device is not supported; the organizer can remove any RSVP.
- No capacity limit.

### Guest list visibility
- **Organizer** sees the full list (name, response, party size, RSVP date, remove) and totals.
- **Guest** sees only the total ("14 people going") and their own RSVP.
- Guest names are never sent to a non-owner's browser.

### Organizer dashboard ("My events")
- Upcoming and past events, each with going / declined / total people.
- Empty state offers "Create event" and **"Create sample event"** (event 7 days ahead with 5 fictional RSVPs).
- Event page (owner view) has "Copy invite link".

### Home (signed out)
- One screen: what the app does, "Sign in with Google", link to a public demo event (seeded).

### AI feature — natural-language event creation
- Organizer types free text (e.g. "Team dinner next Friday 7pm at Mario's") and clicks **Fill with AI**.
- The AI fills name, description (drafts one if absent), date, time, timezone, location, and returns a list of
  **missing** fields. The UI highlights missing fields. **The AI never saves**; the organizer reviews and saves.
- The AI never guesses: absent data is returned as missing.
- Timezone priority: (1) explicit in the text ("7pm EST") → also updates the form's timezone field;
  (2) the form's timezone field (browser prefill); (3) none → `missing: ["timezone"]`.
- The server builds the reference context from the organizer's timezone (e.g. "Today is Thursday 2026-09-24 23:00,
  America/Fortaleza") so relative dates resolve on the organizer's day, not the server's UTC day.
- Understands English, French, and Brazilian Portuguese input.
- Model: Claude Haiku via the Anthropic API with structured output. Timeout 10 s; on timeout/error the UI says
  "Couldn't fill automatically — please fill the form." The manual form always works.
- Signed-in users only; 20 calls per user per day.

### Calendar export
- Guests (and organizers) can download an `.ics` file for the event.

### Internationalization
- UI in **English, French, Brazilian Portuguese** (`next-intl`). Locale detected from the browser, manual switcher.
- Dates and times formatted per locale. Event content (name, description) is not translated.
- A test fails if any locale is missing a message key.

### Out of scope (README "What I left out and why")
Capacity limits · email notifications · "Maybe" response · CSV export · Admin role · multiple organizers per event ·
cross-device RSVP editing for guests · strict CSP · observability beyond logs · per-PR preview deployments.

---

## 3. Architecture

Next.js (App Router, TypeScript) monolith organized as **layered MVC**:

```
src/
  domain/        Model: entities, value objects, policies, typed errors (pure TS, no framework)
  services/      Use cases, one class per action
  repositories/  interfaces.ts · prisma/ (real) · memory/ (fakes for unit tests)
  lib/           auth, AI client, ics, crypto
  app/[locale]/  Controllers (thin Server Actions / route handlers) + Views (React)
messages/        en.json, fr.json, pt-BR.json
evals/           event-parser cases + runner
```

- Controllers only validate input, call a service, and map the result. No business logic.
- Services depend on repository interfaces (dependency inversion); unit tests use in-memory fakes.
- Stack: Prisma + PostgreSQL (Neon in production, Docker locally), Auth.js with Google, zod, Anthropic SDK,
  Vitest, Playwright, Vercel.

### Data model

```
User       (Auth.js) id, email, name, image  + Account, Session
Event      id, slug (unique), ownerId → User, name, description, location?, startsAt (UTC), timezone,
           createdAt, updatedAt
Rsvp       id, eventId → Event (cascade), name, nameKey, status GOING|NOT_GOING, partySize (0–10),
           editTokenHash, createdAt, updatedAt        UNIQUE(eventId, nameKey)
RateLimit  key, windowStart, count                     PK(key, windowStart)
```

### Routes

| Route | Access |
|---|---|
| `/[locale]` | Home |
| `/[locale]/dashboard` | Organizer |
| `/[locale]/events/new` | Organizer (with AI) |
| `/[locale]/e/[slug]` | Everyone — same URL, content by role |
| `/[locale]/e/[slug]/edit` | Owner only (non-owner gets 404) |
| `/e/[slug]/calendar.ics` | Everyone |

Diagrams: [user flows](../diagrams/user-flows.svg) · [AI event parsing](../diagrams/ai-event-parsing.svg).

---

## 4. Errors and security

- Typed domain errors (`EventEnded`, `DuplicateName`, `NotOwner`, `ValidationError`, `RateLimited`) mapped by
  controllers to `{ ok: false, code }` and translated messages. No stack traces to users; unexpected errors are logged.
- Same zod schema on client (feedback) and server (authoritative).
- Authorization enforced in services via policies, not only hidden in the UI.
- RSVP rate limit: 10 submissions / 10 min per IP (IP stored hashed) + honeypot field. AI: 20/day per user.
  Rate limits stored in Postgres (serverless instances do not share memory).
- Prompt injection: user text delimited in the prompt, output constrained to a schema, AI has no tools and cannot
  write, output validated with zod.
- React escaping only; no `dangerouslySetInnerHTML`; description rendered as plain text.
- Secrets in environment variables; `.env.example` without values; AI key in a `server-only` module.
- Headers: `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`.
- Dependabot enabled.

---

## 5. Testing, TDD, and AI evaluation

### TDD (mandatory)
- Every behavior starts with a failing test: commit `test(scope): …` (red), then `feat(scope): …` (green), then
  optional `refactor(scope): …`.
- Declared exceptions: scaffolding/config, pure styling, generated files (`chore` / `style`), listed in the plan.
- The reviewer rejects a PR where a `feat` commit is not preceded by its `test` commit.
- Tests reference requirement IDs (e.g. `REQ-12: blocks duplicate name`).

### Levels
| Level | Tool | Scope | Database |
|---|---|---|---|
| Unit | Vitest | Domain, value objects, policies, services with fakes, AI service with fake client, `.ics`, i18n key parity | None |
| Integration | Vitest | Prisma repositories, concurrent duplicate-name constraint, rate limiter, Server Actions | Docker Postgres / CI service container |
| E2E | Playwright | Guest RSVPs on seeded event; Organizer creates event (AI mocked) and sees list | Docker Postgres |
| Eval | Custom runner | AI accuracy | None (real API) |

- E2E authentication: tests create a session row directly in the database and inject the Auth.js session cookie. No
  fake auth provider in production code.
- Coverage is reported, not gated.

### AI evaluation (quiz)
- ~30 cases in `evals/event-parser/cases.json`, each with a fixed "now" and timezone and an expected result.
- Categories: explicit · relative · timezone · day rollover · explicit timezone overrides browser · missing timezone ·
  incomplete (must not invent) · EN/FR/PT-BR · non-event (reject) · prompt injection.
- Scoring per field; a case passes only if all required fields are correct.
- Gate: ≥ 90% overall **and 100% on "must not invent" and "prompt injection"**.
- Runs on Haiku and Sonnet; the report in `docs/evals/` justifies the model choice (accuracy vs cost).
- Not in CI (cost, non-determinism). Run with `npm run eval`; the `release` agent runs it when the prompt or model
  changed.

### CI (GitHub Actions, every PR)
commitlint → lint → typecheck → unit → integration → e2e → traceability check.

---

## 6. Agentic pipeline

Diagram: [agent pipeline](../diagrams/agent-pipeline.svg).

### Agents (`.claude/agents/`)
| Agent | Model | Responsibility |
|---|---|---|
| `analyst` | Sonnet | Owns business rules (BR-xx) and glossary; resolves DOC failures (asks the human for rule decisions); runs doc-sync before merge |
| `spec-writer` | Opus | Writes the spec (REQ-xx → BR-xx) and plan (TASK-xx → REQ-xx); resolves SPEC failures |
| `implementer` | Sonnet (see amendment A1) | One task or an ordered batch of tasks, strict TDD |
| `reviewer` | Sonnet | Adversarial PR review; classifies findings as CODE / SPEC / DOC; never reviews its own work |
| `release` | Haiku | Checks, eval when needed, migrations, deploy, smoke test, README URL/version |

### Skills (`.claude/skills/`)
- `pipeline` — orchestration and failure routing rules (any session can run the same pipeline).
- `tdd-commit` — red → green → refactor cycle and commit format.
- `timelog` — records phases and pauses in `docs/timelog.md`.

### Flow
```
analyst → business-rules.md → spec-writer → spec.md + plan.md → Ramon approves
per phase: branch → implementer (per task) → PR → reviewer → APPROVE
           → analyst doc-sync (same PR) → CI traceability check → Ramon approves merge → merge commit
final: release → Vercel production → README URL/version
```

### Failure routing — failures escalate upstream
| Class | Signal | Routed to | Action |
|---|---|---|---|
| CODE | Test fails; reviewer finds a defect | implementer | Retry, max 3 attempts per task |
| SPEC | 3 failed attempts; reviewer finds a spec gap | spec-writer | Failure report → task spec revised → attempt counter resets |
| DOC | Rule missing or contradictory; 2 spec revisions failed | analyst | Business rules updated; human decides the rule when needed |
| ENV | Infrastructure, API outage, credentials | human | Not attributed to the spec |

- **No model escalation.** Repeated execution failure is a signal of an imprecise spec, not of a weak model.
- Every escalation is recorded in `docs/pipeline/failures.md` (task, class, root cause, artifact changed, attempts)
  and summarized in the README.

### Documentation ownership
| Document | Owner | When |
|---|---|---|
| TSDoc on public classes/methods, `.env.example` | implementer | Within the task (missing docs = CODE finding) |
| `business-rules.md` | analyst | DOC failure, or an implicit rule surfaced during implementation |
| REQ/TASK status in `spec.md` / `plan.md` | analyst (doc-sync) | Before merge |
| Content of `spec.md` / `plan.md` | spec-writer | SPEC failure |
| README features, CHANGELOG, diagrams | analyst (doc-sync) | Before merge |
| README URL / version | release | After deploy |
| `failures.md`, `timelog.md` | orchestrator (`pipeline` skill) | On escalation / pause |
| Reviews | reviewer | PR comment |

- CI traceability check fails when: a REQ has no test citing it; a test cites a non-existent REQ; a REQ cites a
  non-existent BR; a `.mmd` changed without its `.svg` being regenerated.

### Phase 0 — pipeline bootstrap
1. Repository and CI configuration.
2. Agents and skills.
3. `analyst` writes `business-rules.md` from this brief; `spec-writer` writes `spec.md` and `plan.md`; human approves.
4. **Walking skeleton:** one minimal task goes through the full cycle (implementer → PR → reviewer → doc-sync →
   merge → release → live URL) before any feature work.

---

## 7. Repository and delivery

- Public GitHub repository `event-rsvp-app`. Everything in the repository is in English.
- `main` protected: pull request required, CI must pass, no force push.
- **Merge commits only** (squash and rebase disabled) to preserve `test:` → `feat:` evidence. Branches deleted after
  merge. Branch naming: `phase-N/<slug>`.
- Conventional Commits enforced by commitlint (local hook and CI). PR template with checklist. Dependabot.
- Vercel production deploys on merge to `main`; no per-PR previews (would migrate the production database).
- Neon Postgres via Vercel integration; `prisma migrate deploy` on build; idempotent seed for the demo event.
- Google OAuth app published to "Production" (email/profile scopes need no verification); redirect URIs for
  production and localhost.
- Accounts and secrets (Vercel, Neon, Google Cloud, Anthropic) are created and entered by the human.

### README outline
Live URL + demo event → 60-second walkthrough → features (core / bonus) → architecture (SVG diagrams) → business rules →
run locally (`docker compose up`, env, migrate, dev) → tests → eval results → **How I used AI** (pipeline, models,
failures and their root causes, what I verified by hand) → **What I left out and why** → **Time report**.

---

## Amendments

| # | Date | Decision | Reason |
|---|---|---|---|
| A1 | 2026-09-24 | Executor model changed from Haiku to **Sonnet** | Human decision to reduce wall-clock time. Pipeline rules unchanged: TDD, attempt and revision budgets, upstream failure routing, human gates, no model escalation beyond the configured executor |
| A2 | 2026-09-24 | **Phase 6 — UI/UX.** Visual redesign of every existing screen following `docs/PRODUCT.md` (strategy) and `docs/DESIGN.md` (tokens, typography, components, layout, motion), with `docs/design/phase-6-mockup.html` as the approved visual reference. Two small scope additions: (1) **theme switch** — dark by default, light available from the header, choice remembered in a cookie, no flash on load; (2) **logo** as header mark and favicon (inline SVG). No new product features. WCAG 2.2 AA in both themes. The final README (TASK-148) moves after Phase 6 | Human request: usability and product quality are evaluation criteria; the current UI is unstyled. Direction approved by the human on 2026-09-24 |
| A3 | 2026-09-24 | **Phase 7 — OpenRouter as a second AI provider, alongside Anthropic.** Same strategies as the Anthropic integration: one provider-agnostic `ModelClient` contract; the SDK/HTTP client created lazily on the first AI call; the same delimited prompt, the same zod output schema and the same 10 s timeout budget; structured output (OpenRouter `response_format` JSON schema); no key in CI (E2E uses a local OpenAI-compatible mock server with a configurable port and `reuseExistingServer: false`); the eval runner gains a `--provider` flag and runs the same 30 cases through OpenRouter models, and the production model/provider is the cheapest that passes the gate. **Configuration:** `AI_PROVIDERS` is an ordered list (default `anthropic,openrouter`); a provider without a key is skipped; on a provider failure (network, 5xx, 429, timeout, insufficient credit) the next provider is tried within the same 10 s budget; invalid model output is never retried on another provider (it is a model/prompt problem, not an outage). `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`. **Key management:** the OpenRouter API key is provisioned from the human's management key (system env var) by a local script, with a spend limit, written only to `.env.local`; values are never printed. No UI change beyond what Phase 6 delivers | Human request: OpenRouter credits are available and Anthropic credits are pending; a second provider adds resilience and a cost comparison for the evaluator. Failover order and "no retry on invalid output" are proposed defaults for the human to confirm at spec approval |
| A4 | 2026-09-25 | **Phase 8 — harder AI evaluation + reasoning control.** (a) The OpenRouter client sends `reasoning: { effort }` from `OPENROUTER_REASONING_EFFORT` (default `low`) so reasoning models (e.g. `google/gemini-3.8-flash`) answer within the 10 s budget. (b) The evaluation becomes stricter: ~60 cases (+30 hard cases across all categories: vague times, partial dates, conflicting weekday/date, "next Friday" said on a Friday, month/year rollover, DST gaps, ambiguous timezone abbreviations, offsets and city names, mixed languages, ambiguous `03/04`, past events, questions about events, injection hidden in location/description, fake JSON/system lines, other-language and base64 instructions); each case runs **3 times** and passes only if all 3 pass; timeouts are reported as availability, separately from correctness, with a **p95 latency < 8 s** requirement; the description must not contain facts absent from the input; **each category ≥ 80%** in addition to ≥ 90% overall and 100% on must-not-invent and prompt-injection; about one third of the cases is a **hidden hold-out** set not used for prompt tuning. Production model = cheapest model that passes the new gate. Budget: about USD 1 for four models | Human request: the current eval is saturated (Sonnet 5 scores 100% everywhere) and Gemini 3.8 Flash passed at exactly 90% with three timeouts; the human wants a cheaper production model chosen by a harder test. Gate values approved by the human on 2026-09-25 |
| A5 | 2026-09-25 | **Phase 9 — containerized local run with one command.** `docker compose up --build` starts PostgreSQL and the app: the app container applies migrations (`prisma migrate deploy`) and the idempotent seed on start, then serves on `http://localhost:3000` (host port configurable with `APP_PORT`). `.env.local` is optional: without it the app still starts with an `AUTH_SECRET` generated at container start (local sessions only), the public side works fully, sign-in needs the reader's own Google credentials and "Fill with AI" shows its fallback; with it, the listed keys are used. Image based on Node 22 (npm 10, as in CI) with a full build (no standalone output), so Vercel is unchanged. `docker compose up -d db` starts only the database for development and tests. A new non-required CI job builds and starts the stack and smoke-tests the home page, the demo event page and the `.ics` download. Secrets are never baked into the image | Human request after the fresh-clone run (incident #23): the evaluator should run the whole app with one command, without installing Node. Decisions 1–5 and the spec approved by the human on 2026-09-25 (spec gate pre-approved) |
