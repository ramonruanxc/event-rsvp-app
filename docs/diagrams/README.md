# Diagrams

Flow diagrams are authored as [Mermaid](https://mermaid.js.org/) source (`.mmd`) and rendered to SVG with
[mermaid-cli](https://github.com/mermaid-js/mermaid-cli) to give reviewers a clear, at-a-glance view of the flows
defined in the spec. SVG is used so diagrams stay sharp at any zoom level. The `.mmd` files are the source of truth;
the SVGs are generated artifacts.

| Diagram | Source | Rendered |
|---|---|---|
| User flows (Organizer & Guest) | [user-flows.mmd](user-flows.mmd) | [user-flows.svg](user-flows.svg) |
| AI feature — natural-language event creation | [ai-event-parsing.mmd](ai-event-parsing.mmd) | [ai-event-parsing.svg](ai-event-parsing.svg) |
| Agent pipeline — upstream failure escalation | [agent-pipeline.mmd](agent-pipeline.mmd) | [agent-pipeline.svg](agent-pipeline.svg) |

Shared styling lives in [mermaid.config.json](mermaid.config.json).

## Regenerate

```bash
npx -y @mermaid-js/mermaid-cli@11 -i docs/diagrams/user-flows.mmd -o docs/diagrams/user-flows.svg -c docs/diagrams/mermaid.config.json -b white
npx -y @mermaid-js/mermaid-cli@11 -i docs/diagrams/ai-event-parsing.mmd -o docs/diagrams/ai-event-parsing.svg -c docs/diagrams/mermaid.config.json -b white
npx -y @mermaid-js/mermaid-cli@11 -i docs/diagrams/agent-pipeline.mmd -o docs/diagrams/agent-pipeline.svg -c docs/diagrams/mermaid.config.json -b white
```

To reuse a local Chrome instead of downloading Chromium, set `PUPPETEER_SKIP_DOWNLOAD=true` and pass
`-p <puppeteer.json>` with `{"executablePath": "<path to chrome>"}`.
