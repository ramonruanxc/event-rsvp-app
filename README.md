# Event RSVP App

Create an event, share one link, see who's coming.

## Status

Phase 3 of 6 merged: sharing, calendar export and demo.

**Live demo:** https://event-rsvp-app-flax.vercel.app

**Demo event (no sign-in needed):** https://event-rsvp-app-flax.vercel.app/en/e/demoPicnic

### Features so far

- Sign in with Google.
- Create an event (name, description, date/time, timezone prefilled from the browser, optional location).
- View an event page with its formatted date/time in the event's timezone.
- Edit an event you own, until it starts.
- Delete an event you own, with a confirmation prompt.
- Dashboard listing your upcoming and past events.
- Three interface languages (English, French, Brazilian Portuguese) with a language switcher.
- Guests RSVP from the event page without an account: name, Going / Not going, and party size.
- A returning guest (same browser) sees their own RSVP instead of a blank form, and can change or cancel it.
- Duplicate guest names on the same event are blocked, whether or not the guest has a cookie.
- RSVP submission and editing close once the event starts; the guest page becomes read-only.
- The guest page never exposes other guests' names — only the visitor's own RSVP and the event totals.
- Organizers see every RSVP on their event's guest list with totals, and can remove any RSVP, including after
  the event has ended.
- "Create sample event" fills a new organizer's empty dashboard with a ready-made event and 5 sample RSVPs.
- "Copy invite link" on the owner's event page copies a locale-free link that opens in the guest's own language.
- "Add to calendar" downloads a standard .ics file from the guest and owner event pages, no sign-in required.
- A public demo event, seeded and kept open automatically, lets evaluators RSVP without creating anything.
- A home page that explains the app to signed-out visitors (with a link to the demo event and to Google
  sign-in) and greets signed-in organizers with a link to their dashboard.

### Known limitations

- Google sign-in runs in Testing mode — evaluators' Google accounts are added as test users; guests never need
  to sign in.

## 60-second walkthrough

1. Open the [demo event](https://event-rsvp-app-flax.vercel.app/en/e/demoPicnic) and RSVP as a guest — no sign-in
   required.
2. Sign in with Google, go to your dashboard, click "Create sample event" and see the seeded guest list.
3. Create your own event, copy its invite link, open the link in a private/incognito window and RSVP there.

Google sign-in requires the evaluator's Google account to be added as a test user (see Known limitations above).

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
