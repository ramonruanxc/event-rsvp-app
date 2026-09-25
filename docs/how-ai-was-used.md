# How AI was used

The whole app — code, tests, specification and this documentation — was built by a pipeline of Claude agents working
from a human-approved specification, each gated by tests and an adversarial review before merge. This page is the
narrative version of [`.claude/skills/pipeline/SKILL.md`](../.claude/skills/pipeline/SKILL.md), the file that
actually instructs the agents.

## Agents

| Agent | Model | Owns |
|---|---|---|
| `analyst` | Sonnet | Business rules (`docs/business-rules.md`), glossary, doc-sync (README, CHANGELOG, spec/plan status, diagrams) |
| `spec-writer` | Opus | Specification (`docs/spec.md`, `REQ-xx`) and plan (`docs/plan.md`, `TASK-xx`) |
| `implementer` | Sonnet (Haiku for phase 0) | One task or an ordered batch, strict TDD |
| `reviewer` | Sonnet | Adversarial PR review, finding classification |
| `release` | Haiku | CI check, eval gate, deploy, smoke test |

The orchestrator (the human's main Claude Code session) dispatches agents and enforces the pipeline; agents never
call each other directly.

## Flow

1. **Knowledge** — `analyst` derives business rules from the design brief. Open questions go to the human; the
   decision is recorded as a rule.
2. **Specification** — `spec-writer` turns rules into requirements and tasks. **Gate: the human approves the spec
   and plan.**
3. **Per phase** (one branch, one pull request) — `implementer` executes tasks in strict TDD order; `reviewer`
   does an adversarial review of the PR; on approval, `analyst` syncs the documentation; **gate: the human approves
   the merge**.
4. **Release** — `release` runs after a merge that should reach production: CI check, AI-eval gate, deploy, smoke
   test.

## Traceability

Every business rule (`BR-xx`) traces to a requirement (`REQ-xx`), to a task (`TASK-xx`), to a test named
`REQ-xx: …`. IDs are never renumbered — a superseded rule or requirement is struck through and points to its
replacement. `npm run trace` fails the build if the chain is broken, so a "done" requirement can never be
undocumented or untested.

## Failures escalate upstream, not to a stronger model

A failing test or a reviewer finding is first treated as an implementation defect (routed back to `implementer`,
up to 3 attempts). Three failed attempts mean the task itself is underspecified, so it escalates to `spec-writer`
(up to 2 plan revisions). A spec that stays wrong after two revisions, or a documentation gap the spec-writer
cannot resolve alone, escalates to `analyst`, who either fixes the business rule from existing documents or returns
`NEEDS_HUMAN_DECISION` with concrete options. The rule that is never broken: **no model escalation** — a repeated
execution failure means the spec is imprecise, not that the model needs to be stronger.

Every escalation is logged with its root cause and resolution in
[`docs/pipeline/failures.md`](pipeline/failures.md) — 25 incidents as of Phase 10, from lockfile mismatches and a
port collision to a genuine accessibility defect a characterization test caught by accident.

## Where the evidence lives

- **Every agent run** (model, duration, result) and every human decision: [`docs/timelog.md`](timelog.md).
- **Every escalation and its resolution:** [`docs/pipeline/failures.md`](pipeline/failures.md).
- **"Fill with AI" itself** (the product feature, as opposed to the agents that built the product) is scored
  against a 60-case quiz — everyday and adversarial cases (vague times, date/weekday conflicts, daylight-saving
  gaps, prompt injection) — before a model is trusted as the default; see [`docs/evals/README.md`](evals/README.md).
- **Human gates:** business-rule decisions, spec + plan approval, and every merge to `main` — recorded inline in
  `docs/spec.md`'s "Resolved DOC questions" and in the timelog.
