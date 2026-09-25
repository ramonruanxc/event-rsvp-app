# Architecture

Layered folders, each with one responsibility:

| Folder | Responsibility |
|---|---|
| `src/domain` | Pure business rules and types: validation, time/timezone handling, slugs, policies, totals — no I/O. |
| `src/services` | Use cases (create/update/delete an event, submit/cancel/remove an RSVP, AI parsing, rate limiting, sign-in and registration) that orchestrate the domain and repositories. |
| `src/repositories` | Data access behind interfaces, with a Prisma implementation and an in-memory one for tests. |
| `src/lib` | Cross-cutting helpers: auth (Auth.js config and callbacks), password hashing (`scrypt`), cookies, IP hashing, `.ics` generation, theme, contrast, the AI client. |
| `src/app` | Next.js routes, pages, layouts and Server Actions — thin controllers that call one service and map its result. |

## Stack

- **Framework:** Next.js (App Router), TypeScript, Tailwind v4.
- **Database:** PostgreSQL, accessed through Prisma; Neon in production, a Docker container in development and CI.
- **Auth:** Auth.js — Google OAuth and a Credentials (email/password) provider, JWT sessions.
- **AI:** OpenRouter (default) for "Fill with AI", with an optional Anthropic fallback; see
  [AI evaluation](evals/README.md) for the model-selection evidence.
- **Hosting:** Vercel (app), Neon (production database).
- **Tests:** Vitest (unit, no database; integration, real Postgres), Playwright (E2E, real browser).

## Diagrams

[User flows](diagrams/user-flows.svg) (organizer and guest journeys),
[AI event parsing](diagrams/ai-event-parsing.svg) (the "Fill with AI" pipeline), and
[agent pipeline](diagrams/agent-pipeline.svg) (how the Claude agents that built this app escalate failures). Source
`.mmd` files and the regeneration command are in [diagrams/README.md](diagrams/README.md).
