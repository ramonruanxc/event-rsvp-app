# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Security

- RSVP submissions are rate-limited to 10 per 10 minutes per hashed IP address; the limit is enforced before
  validation and nothing is stored once it is reached (REQ-56).
- A hidden honeypot field on the RSVP form silently rejects likely-bot submissions without revealing the
  mechanism to the sender (REQ-58).
- Every response carries `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and
  `X-Content-Type-Options: nosniff` (REQ-60).
- Confirmed user-supplied event text (e.g. the description) is always rendered as text, never as HTML (REQ-61).

### Added

- "Create sample event" fills a new organizer's empty dashboard with a ready-made event and 5 sample RSVPs
  (REQ-37).
- "Copy invite link" on the owner's event page, with a locale-free invite URL that redirects to the guest's
  browser language (REQ-38).
- Signed-out home page explaining the app, with links to Google sign-in and the public demo event; signed-in
  organizers see a link to their dashboard instead (REQ-39).
- A public, idempotent demo event seed (`demoPicnic`) that stays open for evaluators, re-run automatically on
  deploy (REQ-40).
- .ics calendar file generation for any event, with iCalendar text escaping and line folding (REQ-41).
- "Add to calendar" download route and link on both the guest and owner event pages, no sign-in required
  (REQ-42).
- Guests submit an RSVP from the event page without an account: name, Going / Not going, and party size
  (REQ-20, REQ-23).
- A returning guest (same browser) sees their own RSVP instead of a blank form, and can change or cancel it,
  via a scoped, httpOnly edit-token cookie (REQ-24, REQ-25).
- Duplicate guest names on the same event are blocked, whether or not the guest holds an edit-token cookie
  (REQ-26).
- Cancelling an RSVP keeps it on the list as "Not going" instead of deleting it (REQ-28).
- RSVP submission and editing close once the event starts; the guest page becomes read-only (REQ-29).
- Organizers remove any RSVP from their event's guest list, including after the event has ended (REQ-30).
- Guest event page shows the visitor's own RSVP status and the event totals without exposing other guests'
  names (REQ-31, REQ-33).
- Owner event page lists every RSVP with totals, last-updated time, and a Remove action per row (REQ-34).
- A rate-limited RSVP submission keeps the guest's typed input instead of clearing the form (REQ-57).

### Added

- Organizers create an event: name, description, date/time, timezone (prefilled from the browser, editable),
  and an optional location (REQ-14, REQ-15).
- Event page showing the event's date and time formatted in its own timezone (REQ-12).
- Organizers edit their own events until the event starts; editing is blocked once it has (REQ-16, REQ-17).
- Organizers delete their own events, with a confirmation prompt; the event's RSVPs are deleted with it
  (REQ-18, REQ-19).
- Dashboard listing an organizer's upcoming and past events with RSVP totals (REQ-35, REQ-36).
- Signed-out visitors to organizer pages are sent to Google sign-in and returned to the page they wanted
  (REQ-02).
- Language switcher in the site header (REQ-54).

### Fixed

- Vercel ignored build step now skips by branch (`main` builds), so manual dashboard deployments of `main` are
  not canceled.

### Added

- Next.js 15 app scaffold (TypeScript, Tailwind, App Router, `src/` layout).
- ESLint, Prettier and `tsc --noEmit` scripts.
- Vitest with separate `unit` and `integration` projects.
- Local Postgres via Docker Compose (`rsvp` and `rsvp_test` databases) and `.env.example` / `.env.test`.
- Prisma schema and first migration (Auth.js models, `Event`, `Rsvp`, `RateLimit`).
- First TDD domain behavior: event name validation (`eventNameSchema`, REQ-04).
- `next-intl` internationalization wired for three locales (English, French, Brazilian Portuguese) with a
  translated home page and message-key parity test (REQ-52).
- Auth.js configured with Google as the only sign-in provider and database sessions (REQ-01).
- Playwright setup with database reset and cookie-based sign-in helpers for E2E tests.
- Browser-locale detection middleware (REQ-53).
- Traceability CLI (`npm run trace`) that checks every `done` requirement is cited by a passing test, every
  requirement cites an existing, non-deprecated business rule, and every tracked diagram has an up-to-date SVG
  (REQ-90).
- Local commit-message hook (commitlint) and GitHub Actions CI workflow (lint, typecheck, unit, integration, e2e,
  traceability).
- Vercel build configuration (`vercel.json`, `vercel-build` script) that skips non-production deployments.

[Unreleased]: https://github.com/ramonruanxc/event-rsvp-app/compare/main...phase-0/walking-skeleton
