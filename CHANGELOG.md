# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
