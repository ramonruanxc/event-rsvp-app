# Design

Visual system for the Event RSVP App (product register). Source of truth for Phase 6. Colors derive from the logo:
indigo `#3630B0` (calendar) and turquoise `#3BDBD1` (check).

## Scene

An organizer at a laptop in daylight and a guest on a phone opening a link from a chat app at night on the couch. The
default theme is **dark** (human decision); a **light** theme is one click away in the header and remembered.

## Color strategy

**Restrained.** Neutrals tinted toward the logo's indigo hue (h ≈ 277). Indigo carries primary actions, links and
focus. Turquoise carries only confirmation and success ("going", "copied", "saved"). Semantic colors for warning
(missing AI fields), danger (delete, remove) and ended state. No pure black or white anywhere.

## Tokens (OKLCH)

| Token | Dark (default) | Light | Use |
|---|---|---|---|
| `--bg` | `oklch(0.17 0.018 277)` | `oklch(0.985 0.004 277)` | Page |
| `--surface` | `oklch(0.21 0.02 277)` | `oklch(0.995 0.003 277)` | Panels, inputs |
| `--surface-2` | `oklch(0.25 0.022 277)` | `oklch(0.955 0.008 277)` | Header, hover rows, segmented track |
| `--border` | `oklch(0.34 0.02 277)` | `oklch(0.88 0.012 277)` | Dividers only (decorative, below 3:1) |
| `--border-input` | `oklch(0.56 0.03 277)` | `oklch(0.6 0.03 277)` | Inputs, secondary buttons, stepper, selected segment (≥ 3:1) |
| `--text` | `oklch(0.95 0.006 277)` | `oklch(0.22 0.02 277)` | Body |
| `--text-muted` | `oklch(0.74 0.014 277)` | `oklch(0.46 0.018 277)` | Secondary text (≥ 4.5:1) |
| `--primary` | `oklch(0.55 0.19 277)` | `oklch(0.42 0.2 277)` | Primary button background, active tab (on-primary ≥ 4.5:1) |
| `--primary-hover` | `oklch(0.51 0.19 277)` | `oklch(0.37 0.2 277)` | Hover darkens in both themes to keep contrast |
| `--on-primary` | `oklch(0.99 0.004 277)` | `oklch(0.99 0.004 277)` | Text on primary (≥ 4.5:1) |
| `--link` | `oklch(0.78 0.12 277)` | `oklch(0.45 0.2 277)` | Links, focus ring |
| `--success` | `oklch(0.84 0.12 185)` | `oklch(0.5 0.1 185)` | Check, "Going", "Copied" (text/icon) |
| `--success-bg` | `oklch(0.3 0.05 185)` | `oklch(0.95 0.035 185)` | Confirmation panel tint |
| `--warning` | `oklch(0.85 0.13 85)` | `oklch(0.52 0.12 70)` | Missing-field hint |
| `--warning-bg` | `oklch(0.3 0.05 85)` | `oklch(0.96 0.04 85)` | Missing-field input tint |
| `--danger` | `oklch(0.72 0.17 25)` | `oklch(0.5 0.19 27)` | Delete, remove, errors |
| `--on-danger` | `var(--bg)` | `var(--on-primary)` | Text on the filled Delete button (≥ 4.5:1) |
| `--danger-bg` | `oklch(0.3 0.06 25)` | `oklch(0.96 0.03 25)` | Error panel tint |

Contrast must be verified in implementation (automated check in unit tests on the token values).

## Typography

One family: **Geist Sans** (already loaded by the scaffold through `next/font`), fallback `system-ui, sans-serif`.
Geist Mono only for the invite URL.

| Step | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 2rem / 1.15 | 650 | Event title, home headline |
| `h2` | 1.375rem / 1.25 | 600 | Section titles ("Guest list", "Will you come?") |
| `h3` | 1.125rem / 1.35 | 600 | Group labels ("What", "When", "Where") |
| `body` | 1rem / 1.55 | 400 | Text, inputs |
| `small` | 0.875rem / 1.45 | 450 | Meta, helper text, table cells |
| `micro` | 0.75rem / 1.4 | 550, +0.02em | Status pills, overlines |

Prose max width 65ch. Numbers in counts and dates use `font-variant-numeric: tabular-nums`.

## Spacing, radius, elevation

- 4 px base: 4, 8, 12, 16, 24, 32, 48, 64. Vary rhythm: 8 inside controls, 16 between fields, 32 between sections.
- Radius: 8 px controls, 12 px panels, full for pills and the avatar/check badge.
- Elevation: none by default; separation by `--surface` vs `--bg` and 1 px borders. One shadow token for the
  popover/confirm menu only.

## Layout

- **Top bar** (all pages): logo mark (24 px) + "Event RSVP" wordmark left; right: language select, theme toggle
  (sun/moon icon button with `aria-pressed`), then "Sign in" (leads to the sign-in page, which offers Google and
  email/password) or the user menu (avatar initial, Dashboard, Account, Sign out). Height 56 px, `--surface-2`,
  bottom border.
- Content column: event and form pages max 640 px; dashboard max 880 px; home max 960 px. Side padding 16 px on
  phones, 24 px from 640 px.
- Mobile-first; single column below 640 px; dashboard rows stack meta under the title below 640 px.

## Components

Every interactive component defines default, hover, focus-visible (2 px `--link` ring, 2 px offset), active, disabled,
loading and error states.

- **Button**: primary (filled `--primary`), secondary (surface + border), ghost (text only), danger (text `--danger`,
  filled only inside the delete confirmation). Height 40 px (44 px on the guest RSVP submit). Loading: label kept,
  inline spinner, `aria-busy`.
- **Input / textarea / select**: `--surface`, 1 px `--border-input`, 8 px radius, 40 px height; label above (never
  placeholder-only); helper/error text below; error = `--danger` border + message with icon; AI-missing =
  `--warning-bg` tint + "Needed" hint.
- **Segmented control** (Going / Not going): two equal buttons in a `--surface-2` track; selected = `--surface` +
  border + weight 600, plus a check icon on "Going" in `--success`. Implemented as a radio group.
- **Stepper** (party size): minus / value / plus, 44 px targets, bounds 1–10, disabled at bounds, hidden when Not going.
- **Status pill**: Going (`--success` text on `--success-bg`, check icon), Declined (muted text, x icon), Ended
  (muted, clock icon). Never color alone: icon + word.
- **Confirmation panel** (after RSVP): `--success-bg` tint, turquoise check badge (the brand moment), "You're going ·
  3 people" in h2, "Change" (secondary) and "Cancel RSVP" (ghost danger). For Not going: neutral panel, "You're not
  going", "Change".
- **Guest list**: semantic `<table>` on ≥ 640 px (Name, Response pill, People, Last updated, Remove), stacked rows on
  phones. Totals line above: "7 going · 2 declined · 11 people" (tabular numbers, no metric tiles).
- **Inline confirm** (delete event, remove RSVP): the action expands in place into "Delete this event? · Delete ·
  Keep" instead of a modal.
- **Copy invite link**: read-only mono field with the URL + "Copy link" button; on success the button becomes
  "Copied" with a check in `--success` for 2 s and an `aria-live` announcement.
- **Empty state** (dashboard): short explanation of the three steps (create, share, watch replies), primary "Create
  event", secondary "Create sample event".
- **AI panel** (new event): top of the form, `--surface-2` block: label "Describe your event", textarea (3 rows),
  "Fill with AI" secondary button with a sparkle icon; states: working (button loading), filled (brief success line
  "Filled 5 fields · check them below"), missing (fields tinted), not an event / limit / failure (inline alert in the
  panel).

## Motion

150–200 ms, `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quart). Only: button/segment state, confirmation panel reveal
(opacity + 4 px translate), copied state, inline-confirm expand (opacity + height via grid rows). Reduced motion:
opacity only.

## Iconography

`lucide-react` (tree-shaken, 16/20 px, 1.75 stroke): calendar-plus, check, x, clock, copy, sparkles, sun, moon,
globe, trash-2, pencil, map-pin, users. Decorative icons `aria-hidden`.

## Theme implementation notes

- Theme stored in a `theme` cookie (`dark` | `light`), default `dark`; the root layout reads it server-side and sets
  `data-theme` on `<html>` so there is no flash. Toggle is a client component that updates the cookie and attribute.
- Tokens defined as CSS custom properties under `[data-theme="dark"]` and `[data-theme="light"]`, exposed to Tailwind
  v4 through `@theme inline`.
- Header mark: the logo redrawn as an inline SVG (indigo `#3630B0` calendar, turquoise `#3BDBD1` check) so it has no
  background box in the dark theme; favicon `src/app/icon.svg` from the same SVG.
- Below 480 px the language select collapses to a 40 px globe button (native select, full names in the list). "Sign
  in" (Phase 10, A6) already reads the same at every width, so there is no longer a short form to switch to.

## Approved mockup

`docs/design/phase-6-mockup.html` (8 screens, dark and light, phone width toggle) is the visual reference for Phase 6.
Where the mockup and this file disagree, this file wins.

## Revision log

- 2026-09-24: contrast fixes found while building the mockup: dark `--primary` 0.62 → 0.55 (on-primary 3.73 → 5.01:1),
  new `--border-input` (inputs were 1.5:1), new `--on-danger`; copy: "Cancel RSVP", "See the demo event", "Copied".
- 2026-09-25 (Phase 10, A6, doc-sync): top bar and user menu updated for email/password sign-in — "Sign in" (not
  "Sign in with Google") leads to a sign-in page offering both methods, the user menu gains "Account", and the
  narrow-width short label no longer applies (see `docs/plan.md`, Phase 10 note 20).
