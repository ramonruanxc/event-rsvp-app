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

  for (const line of markdown.split(/\r?\n/)) {
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
  const lines = markdown.split(/\r?\n/);
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

const TEST_FILE_PATTERN = /\.test\.tsx?$/;
const INT_TEST_FILE_PATTERN = /\.int\.test\.ts$/;
const E2E_FILE_PATTERN = /^e2e\/.+\.spec\.ts$/;

/**
 * Tells whether `path` is a test file that the traceability check should scan for REQ citations:
 * unit/component (`*.test.ts` / `*.test.tsx`), integration (`*.int.test.ts`), or e2e (`e2e/*.spec.ts`).
 */
export function isTestFile(path: string): boolean {
  return (
    TEST_FILE_PATTERN.test(path) || INT_TEST_FILE_PATTERN.test(path) || E2E_FILE_PATTERN.test(path)
  );
}

const CITATION = /\b(?:it|test|describe)(?:\.\w+)*\(\s*['"`](REQ-\d+):/g;

/**
 * Scans test file contents for citations — test titles starting with `REQ-xx:` inside an `it(`,
 * `test(`, `describe(`, or any `.skip`/`.only`/etc. variant call. Returns a map from REQ id to the
 * list of file paths that cite it (each path listed once, even with multiple citations in the file).
 */
export function findCitations(
  files: Array<{ path: string; content: string }>,
): Map<string, string[]> {
  const citations = new Map<string, string[]>();

  for (const { path, content } of files) {
    const reqIdsInFile = new Set<string>();
    for (const match of content.matchAll(CITATION)) {
      reqIdsInFile.add(match[1]);
    }
    for (const reqId of reqIdsInFile) {
      const paths = citations.get(reqId) ?? [];
      paths.push(path);
      citations.set(reqId, paths);
    }
  }

  return citations;
}
