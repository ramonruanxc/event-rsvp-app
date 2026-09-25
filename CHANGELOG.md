# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- "Fill with AI" on the new-event form: describe an event in your own words and the AI fills name, description,
  date, time, timezone and location, flagging any field it could not find (REQ-43, REQ-45, REQ-51).
- Timezone resolution prefers a timezone stated in the text over the form's prefilled value (REQ-46).
- A 10-second timeout and graceful fallback message when the AI is slow or unavailable (REQ-47).
- A daily limit of 20 "Fill with AI" calls per signed-in user, backed by a fixed-window rate limiter shared with
  RSVP submissions (REQ-48, REQ-55).
- "Fill with AI" requires sign-in and never saves the event on its own — only "Save event" does (REQ-49, REQ-50).
- Text that does not describe an event shows "Couldn't find event details in that text." instead of guessing
  (REQ-45, REQ-51).
- An eval runner (`npm run eval`) and a 30-case dataset that score the AI parser against expected fields, with a
  pass/fail gate and a Markdown report (REQ-91, REQ-92).
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
