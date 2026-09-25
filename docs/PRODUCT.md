# Product

## Register

product

## Users

- **Organizers** sign in with Google on a laptop, usually during the day, to create an event in about a minute,
  share one link, and later check who is coming. They return to the dashboard a few times per event.
- **Guests** open the invite link on a phone, often straight from a messaging app, anywhere and in any light. They
  answer in about ten seconds, without an account, and may come back from the same browser to change their answer.
- **Evaluators** (hiring reviewers) open the live URL, try both roles in under two minutes, and judge usability and
  product quality.

## Product Purpose

Plan an event, share one link, see who is coming. Success: a guest RSVPs without thinking about the interface; an
organizer trusts the guest list at a glance; an evaluator finds nothing strange or unfinished.

## Brand Personality

Calm, clear, trustworthy. The interface disappears into the task. Warmth comes from one moment only: the confirmation
check after an RSVP, which echoes the logo (an indigo calendar with a turquoise check). Copy is short, direct and
friendly, never cute.

## Anti-references

- Generic SaaS landing templates: gradient heroes, big-number metric tiles, identical icon-card grids.
- Party-invite maximalism (confetti, heavy illustration, novelty fonts): wrong tone for a trustworthy tool.
- Corporate calendar density: grey forms with no hierarchy.

## Design Principles

1. **The task is the interface.** Every screen has one primary action, visually obvious; everything else recedes.
2. **Guest first, phone first.** The event page is designed for a 375 px screen and a thumb before any desktop layout.
3. **Earned familiarity.** Standard controls, standard patterns (top bar, segmented choice, list with status), no
   invented affordances.
4. **State is always visible.** Going, not going, ended, copied, missing field, AI working: each has a distinct,
   accessible visual state; nothing relies on color alone.
5. **One brand moment.** The turquoise check is reserved for "you're going" and success; indigo is reserved for primary
   actions and focus.

## Accessibility & Inclusion

- WCAG 2.2 AA: text contrast 4.5:1 (3:1 for large text and UI boundaries), visible focus on every control, full
  keyboard operation, labels on all inputs, errors announced (`role="alert"` / `aria-live`), target size ≥ 24 px.
- Dark theme by default with a light theme available; both meet AA independently.
- `prefers-reduced-motion`: transitions reduced to opacity only.
- Three UI languages (en, fr, pt-BR): layouts must tolerate 30% longer French strings.
