# Event RSVP App

Create an event, share one link, see who's coming.

## Status

Phase 0 of 6 merged: walking skeleton.

## Run locally

Prerequisites: Node 22, Docker.

```bash
npm ci
docker compose up -d
cp .env.example .env.local   # then fill in the values (see docs/plan.md, HUMAN-04)
npx dotenv -e .env.local -- prisma migrate dev
npm run dev
```

The app serves on `http://localhost:3000`. If port 3000 is already in use, set `E2E_PORT` (see below) and run
`npm run dev -- -p 3100` instead.

## Tests

```bash
npm run test:unit     # Vitest, no database
npm run test:int      # Vitest, Docker Postgres (rsvp_test)
npm run test:e2e      # Playwright, Docker Postgres (rsvp_test); uses E2E_PORT (default 3000)
npm run trace         # traceability check: every done requirement is cited by a passing test
```

## Start here

- **Design brief:** [docs/design/2026-09-24-design-brief.md](docs/design/2026-09-24-design-brief.md)
- **Agent pipeline:** [docs/diagrams/agent-pipeline.svg](docs/diagrams/agent-pipeline.svg)
- **User flows:** [docs/diagrams/user-flows.svg](docs/diagrams/user-flows.svg)
- **Business rules:** [docs/business-rules.md](docs/business-rules.md)
- **Spec:** [docs/spec.md](docs/spec.md)
- **Plan:** [docs/plan.md](docs/plan.md)
- **Failure log:** [docs/pipeline/failures.md](docs/pipeline/failures.md)
- **Time log:** [docs/timelog.md](docs/timelog.md)
