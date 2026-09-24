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
