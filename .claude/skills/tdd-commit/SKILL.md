---
name: tdd-commit
description: Mandatory red → green → refactor cycle and Conventional Commit format for the Event RSVP App. Use whenever implementing a task or reviewing TDD evidence in a PR.
---

# TDD commit cycle

TDD is mandatory. The commit history is the evidence, so the order of commits matters.

## Cycle (per behavior)

1. **Red** — write one failing test named after its requirement: `REQ-12: rejects duplicate name (case/space-insensitive)`.
   Run it. Confirm it fails **for the expected reason** (an assertion, not a syntax or import error).
   Commit: `test(<scope>): <behavior>`
2. **Green** — write the minimum code to pass. Run the test and the unit suite.
   Commit: `feat(<scope>): <behavior>` (or `fix(<scope>): …` when correcting behavior)
3. **Refactor** (optional) — improve structure with tests green.
   Commit: `refactor(<scope>): <what>`

One behavior per cycle. Never combine the test and its implementation in one commit.

## Declared exceptions (no test commit required)

| Type | Use for |
|---|---|
| `chore` | scaffolding, configuration, dependency changes |
| `style` | pure styling (CSS/Tailwind classes, formatting) with no behavior |
| `docs` | documentation only |
| `ci` / `build` | pipeline and build configuration |

Generated files (Prisma client, SVG diagrams) are never hand-edited.

## Commit format (Conventional Commits, enforced by commitlint)

```
<type>(<scope>): <imperative summary, lower case, ≤ 100 chars>

<optional body: why, not what>

Refs: TASK-31, REQ-12
```

Scopes: `domain`, `services`, `repositories`, `auth`, `ai`, `rsvp`, `events`, `i18n`, `ui`, `db`, `e2e`, `eval`,
`pipeline`, `docs`, `deps`.

## Reviewer verification

`git log main..HEAD --reverse --format='%h %s'` — every `feat`/`fix` must follow a `test` commit for the same
behavior. When unsure, `git checkout <test-commit>` and run the test: it must fail.
