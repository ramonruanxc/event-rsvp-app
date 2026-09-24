# Pipeline failure log

Every escalation in the pipeline is recorded here. Failures escalate upstream:
**execution → specification → documentation**. See the [agent pipeline diagram](../diagrams/agent-pipeline.svg).

| Class | Meaning | Routed to |
|---|---|---|
| CODE | Implementation defect (test fails, reviewer finds a bug) | implementer (max 3 attempts per task) |
| SPEC | 3 failed attempts, or reviewer finds a spec gap | spec-writer |
| DOC | Business rule missing or contradictory, or 2 spec revisions failed | analyst → human decision |
| ENV | Infrastructure, API outage, credentials — not attributed to the spec | human |

## Incidents

| # | Date | Task | Class | Attempts | Root cause | Artifact changed | Resolution |
|---|---|---|---|---|---|---|---|
| 1 | 2026-09-24 | Spec (phase 0) | DOC | — | BR-37/BR-38 ambiguous (can a cookie for one RSVP edit another RSVP's name?); no rule for "Fill with AI" on non-event text (BR-55 vs BR-59) | business-rules.md (BR-37, BR-38, BR-55 amended; BR-96 new) → spec.md, plan.md | Human decided: cookie only authorizes its own RSVP (DUPLICATE_NAME); non-event text → all fields missing + message "Couldn't find event details in that text." |
| 2 | 2026-09-24 | TASK-02, TASK-03 | CODE (process) | 1 each | Implementer ran Prettier / produced files but left formatting uncommitted; `format:check` passed locally, would fail on a clean checkout | `.claude/agents/implementer.md` (format:check + clean `git status` required per task) | Orchestrator committed the formatting (`style:` commits); rule added so it cannot recur |
| 3 | 2026-09-24 | TASK-10, TASK-11 | ENV | — | Port 3000 occupied by an unrelated local application; Playwright could silently test the wrong app | plan.md (TASK-10, TASK-11, HUMAN-04 via spec-writer; human-decision revision, not a failure revision) | Human chose a configurable `E2E_PORT` (3100 locally, 3000 in CI); independent traceability batch run ahead meanwhile |
