---
name: pipeline
description: Orchestrates the Event RSVP App agentic pipeline — which agent runs when, human gates, and how failures escalate upstream (execution → spec → documentation). Use when starting a phase, dispatching an agent, handling an agent failure, or merging a PR.
---

# Pipeline

Diagram: `docs/diagrams/agent-pipeline.svg`. Design: `docs/design/2026-09-24-design-brief.md` §6.

The orchestrator (main session) dispatches agents and enforces this playbook. Agents never call each other directly.

## Agents

| Agent | Model | Owns |
|---|---|---|
| analyst | sonnet | `docs/business-rules.md`, glossary, doc-sync |
| spec-writer | opus | `docs/spec.md` (REQ-xx), `docs/plan.md` (TASK-xx) |
| implementer | sonnet | one task or an ordered batch, strict TDD |
| reviewer | sonnet | adversarial PR review, finding classification |
| release | haiku | CI check, eval gate, deploy, smoke test |

If a newly created agent is not yet registered in the session, dispatch a general-purpose agent with the agent file's
body as instructions and the same `model`.

## Traceability

`BR-xx` (business rule) → `REQ-xx` (requirement) → `TASK-xx` (task) → test named `REQ-xx: …`.
IDs are stable. A CI script fails the build if the chain is broken or a `.mmd` changed without its `.svg`.

## Flow

1. **Knowledge** — `analyst` (Mode 1) writes/updates `docs/business-rules.md`.
   Open questions → ask the human → `analyst` records the decision.
2. **Specification** — `spec-writer` writes `docs/spec.md` + `docs/plan.md`.
3. **Gate: human approves spec + plan.**
4. **Per phase** (one branch `phase-N/<slug>`, one PR):
   1. For each task in order: dispatch `implementer` with the task ID.
   2. Push, open the PR with `.github/pull_request_template.md`.
   3. Dispatch `reviewer` with the PR number.
   4. On `APPROVE`: dispatch `analyst` (Mode 3, doc-sync) on the same branch. Wait for CI green.
   5. **Gate: human approves the merge.** Merge with a merge commit (`gh pr merge <n> --merge --delete-branch`).
5. **Release** — dispatch `release` after merges that should reach production.

## Failure routing — failures escalate upstream

| Signal | Class | Route | Counter |
|---|---|---|---|
| implementer returns failing tests, or reviewer CODE finding | CODE | implementer | attempts per task, max 3 |
| implementer `SPEC_FAILURE` (3 attempts), or reviewer SPEC finding | SPEC | spec-writer revises the task → implementer retries with attempts reset | revisions per task, max 2 |
| spec-writer `DOC_FAILURE`, 2 revisions failed, or reviewer DOC finding | DOC | analyst (Mode 2) → human decision if needed → spec-writer → implementer | — |
| any `ENV_FAILURE` | ENV | human | — |

Rules:
- **No model escalation.** Never re-run a failed task on a stronger model. Repeated execution failure means the spec
  is imprecise; fix the spec.
- ENV failures are never counted against the spec.
- The revision counter (max 2) counts only revisions caused by a **SPEC failure** of that task. Revisions that apply
  a resolved DOC question or a human decision are not failure revisions and do not consume the budget.
- Reviewer loop: at most 2 `REQUEST_CHANGES` rounds per PR; a 3rd means the phase's tasks are underspecified → SPEC.

## Recording

- Every escalation (SPEC, DOC, ENV) → a row in `docs/pipeline/failures.md`:
  `# | date | task | class | attempts | root cause | artifact changed | resolution`.
- Phase changes and pauses → `timelog` skill.

## Human gates

1. Business-rule decisions (open questions, DOC failures).
2. Spec + plan approval.
3. Every merge to `main`.
