/**
 * Parsers for the traceability chain (`docs/business-rules.md` → `docs/spec.md` → tests).
 * All functions here are pure and operate on already-read file contents, so they are unit-testable
 * without touching the filesystem.
 */

/**
 * Result of parsing `docs/business-rules.md`.
 */
export interface ParsedBusinessRules {
  /** Every BR id found as a `#### BR-xx` heading, active or deprecated. */
  ids: Set<string>;
  /** The subset of `ids` written as `#### ~~BR-xx~~ …` (superseded rules). */
  deprecated: Set<string>;
}

const BR_HEADING = /^####\s+(~~)?(BR-\d+)(~~)?/;

/**
 * Reads BR ids from `docs/business-rules.md` headings.
 * A heading `#### BR-xx — …` is an active rule; `#### ~~BR-xx~~ …` is deprecated (its id is still
 * returned in `ids`, and also added to `deprecated`). BR ids mentioned in prose (not at the start of
 * a `####` heading) are ignored.
 */
export function parseBusinessRules(markdown: string): ParsedBusinessRules {
  const ids = new Set<string>();
  const deprecated = new Set<string>();

  for (const line of markdown.split('\n')) {
    const match = BR_HEADING.exec(line);
    if (!match) continue;
    const [, strikeStart, id] = match;
    ids.add(id);
    if (strikeStart) deprecated.add(id);
  }

  return { ids, deprecated };
}

/**
 * A requirement block parsed from `docs/spec.md`.
 */
export interface ParsedReq {
  /** The requirement id, e.g. `REQ-12`. */
  id: string;
  /** BR ids listed on the `**Rules:**` line, empty when the requirement is tooling-only. */
  rules: string[];
  /** `true` when `**Rules:**` reads exactly `none (tooling)`. */
  tooling: boolean;
  /** The trimmed word after `**Status:**`, e.g. `todo`, `in-progress`, `done`. */
  status: string;
}

const REQ_HEADING = /^###\s+(REQ-\d+)\s+—/;
const RULES_LABEL = /^\*\*Rules:\*\*\s*(.*)$/;
const STATUS_LABEL = /^\*\*Status:\*\*\s*(.*)$/;

/**
 * Reads requirement blocks from `docs/spec.md`: their id, cited business rules, whether they are
 * declared tooling-only (`**Rules:** none (tooling)`), and their status. Headings that are not
 * `### REQ-xx — …` (e.g. `### DOC-Q1 — …` or section titles) are not requirements.
 */
export function parseRequirements(markdown: string): ParsedReq[] {
  const lines = markdown.split('\n');
  const requirements: ParsedReq[] = [];

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = REQ_HEADING.exec(lines[i]);
    if (!headingMatch) continue;

    const id = headingMatch[1];
    let rules: string[] = [];
    let tooling = false;
    let status = '';

    for (let j = i + 1; j < lines.length && !lines[j].startsWith('###'); j++) {
      const rulesMatch = RULES_LABEL.exec(lines[j]);
      if (rulesMatch) {
        const text = rulesMatch[1].trim();
        tooling = text === 'none (tooling)';
        rules = text.match(/BR-\d+/g) ?? [];
        continue;
      }
      const statusMatch = STATUS_LABEL.exec(lines[j]);
      if (statusMatch) {
        status = statusMatch[1].trim();
      }
    }

    requirements.push({ id, rules, tooling, status });
  }

  return requirements;
}
