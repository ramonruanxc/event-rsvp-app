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
