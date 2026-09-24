/**
 * Consistency checks for the traceability chain, built on top of `scripts/traceability/parse.ts`.
 * All functions here are pure: callers gather the inputs (file contents, git timestamps) and these
 * functions only report problems as strings.
 */

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
