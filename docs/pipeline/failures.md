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
| 4 | 2026-09-24 | TASK-01…TASK-19 (dependencies) | CODE | 1 | `package-lock.json` generated with npm 11 (local Node 24); CI's npm 10 (Node 22) resolves an optional peer (`@swc/helpers` under `next-intl`) differently, so `npm ci` failed in every CI job. Hidden until the first CI run | `package-lock.json` regenerated with npm 10 and validated with `npm ci` on npm 10 and 11; implementer rule added | Reviewer round 1 finding #1 |
| 5 | 2026-09-24 | TASK-03 | CODE | — | Commit body line of 344 chars (Haiku); the local commit-msg hook only arrived in TASK-18 | Commit reworded (history rewrite on PR branch, authorized by human; tree unchanged) | Reviewer round 1 finding #2 |
| 6 | 2026-09-24 | TASK-02 | CODE | — | `commitlint.config.mjs` changed outside the task's file list | None — accepted as justified deviation (required for lint to pass) | Reviewer round 1 finding #3 |
| 7 | 2026-09-24 | Repository | ENV | — | Windows `core.autocrlf=true` re-materialized LF files as CRLF after a reset; local `format:check` flagged 33 files (CI unaffected) | `.gitattributes` (`* text=auto eol=lf`) | Found by orchestrator while verifying the lockfile fix |
| 8 | 2026-09-24 | TASK-20, HUMAN-01 | ENV | — | Vercel project created without an initial deployment; a deployment of `main` created by hand in the dashboard was not flagged production, so the Ignored Build Step `[ "$VERCEL_ENV" != "production" ]` canceled it | plan.md (TASK-20 Rev 2, HUMAN-01 steps 1 and 6 via spec-writer; human-decision revision, not a failure revision) + vercel.json | Human decided a branch-based ignore step `[ "$VERCEL_GIT_COMMIT_REF" != "main" ]`: per-PR previews still skipped, any deployment of `main` builds; the merge to `main` triggers the production deploy |

