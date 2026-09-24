/**
 * Consistency checks for the traceability chain, built on top of `scripts/traceability/parse.ts`.
 * All functions here are pure: callers gather the inputs (file contents, git timestamps) and these
 * functions only report problems as strings.
 */

import type { ParsedBusinessRules, ParsedReq } from './parse';

/**
 * Timestamps (in seconds, as returned by `git log -1 --format=%ct`) for one tracked
 * `docs/diagrams/*.mmd` diagram source and its generated `.svg`.
 */
export interface DiagramInfo {
  /** Path to the `.mmd` source, e.g. `docs/diagrams/user-flows.mmd`. */
  mmd: string;
  /** Last commit time of the `.mmd` file, in seconds. */
  mmdTime: number;
  /** Last commit time of the matching `.svg` file, in seconds, or `null` when it is not tracked. */
  svgTime: number | null;
}

/**
 * Reports diagrams whose generated `.svg` is missing or older than its `.mmd` source.
 */
export function checkDiagrams(diagrams: DiagramInfo[]): string[] {
  const problems: string[] = [];

  for (const { mmd, mmdTime, svgTime } of diagrams) {
    const svg = mmd.replace(/\.mmd$/, '.svg');
    if (svgTime === null) {
      problems.push(`${svg} is missing`);
    } else if (svgTime < mmdTime) {
      problems.push(`${svg} is older than ${mmd} — regenerate it`);
    }
  }

  return problems;
}

/**
 * Input gathered from `docs/business-rules.md`, `docs/spec.md`, and the test files, for
 * {@link checkRequirements}.
 */
export interface RequirementsInput {
  /** BR ids and deprecated BR ids, from {@link parseBusinessRules}. */
  brs: ParsedBusinessRules;
  /** Requirement blocks, from {@link parseRequirements}. */
  reqs: ParsedReq[];
  /** REQ id → citing test file paths, from {@link findCitations}. */
  citations: Map<string, string[]>;
}

/**
 * Cross-checks requirements against business rules and test citations, reporting:
 * - a `done` requirement that no test cites
 * - a test citing a requirement that does not exist in `docs/spec.md`
 * - a requirement citing a business rule that does not exist in `docs/business-rules.md`
 * - a requirement citing a deprecated business rule
 * - a non-tooling requirement with no business rule at all
 */
export function checkRequirements({ brs, reqs, citations }: RequirementsInput): string[] {
  const problems: string[] = [];
  const knownReqIds = new Set(reqs.map((req) => req.id));

  for (const req of reqs) {
    if (req.status === 'done' && (citations.get(req.id) ?? []).length === 0) {
      problems.push(`${req.id} is done but no test cites it`);
    }
  }

  for (const [reqId, paths] of citations) {
    if (knownReqIds.has(reqId)) continue;
    for (const path of paths) {
      problems.push(`${path} cites ${reqId}, which does not exist in docs/spec.md`);
    }
  }

  for (const req of reqs) {
    for (const ruleId of req.rules) {
      if (!brs.ids.has(ruleId)) {
        problems.push(`${req.id} cites ${ruleId}, which does not exist in docs/business-rules.md`);
      } else if (brs.deprecated.has(ruleId)) {
        problems.push(`${req.id} cites deprecated ${ruleId}`);
      }
    }
  }

  for (const req of reqs) {
    if (!req.tooling && req.rules.length === 0) {
      problems.push(
        `${req.id} has no business rule (use "none (tooling)" for tooling requirements)`,
      );
    }
  }

  return problems;
}
