/**
 * Traceability CLI (`npm run trace`): cross-checks `docs/business-rules.md`, `docs/spec.md`, the
 * test suites, and the tracked diagrams for the BR → REQ → TASK → test chain described in
 * `docs/spec.md`.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkDiagrams, checkRequirements } from './check';
import { findCitations, isTestFile, parseBusinessRules, parseRequirements } from './parse';

function listTrackedFiles(repoRoot: string): string[] {
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

function lastCommitTime(repoRoot: string, path: string): number {
  const timestamp = execFileSync('git', ['log', '-1', '--format=%ct', '--', path], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  return Number(timestamp);
}

/**
 * Runs the traceability check against the repository at `repoRoot` and returns every problem
 * found (empty when the repository is consistent).
 */
export function runTraceability(repoRoot: string): string[] {
  const brs = parseBusinessRules(readFileSync(join(repoRoot, 'docs/business-rules.md'), 'utf8'));
  const reqs = parseRequirements(readFileSync(join(repoRoot, 'docs/spec.md'), 'utf8'));

  const trackedFiles = listTrackedFiles(repoRoot);

  const testFiles = trackedFiles.filter(isTestFile).map((path) => ({
    path,
    content: readFileSync(join(repoRoot, path), 'utf8'),
  }));
  const citations = findCitations(testFiles);

  const diagrams = trackedFiles
    .filter((path) => path.startsWith('docs/diagrams/') && path.endsWith('.mmd'))
    .map((mmd) => {
      const svg = mmd.replace(/\.mmd$/, '.svg');
      return {
        mmd,
        mmdTime: lastCommitTime(repoRoot, mmd),
        svgTime: trackedFiles.includes(svg) ? lastCommitTime(repoRoot, svg) : null,
      };
    });

  return [...checkRequirements({ brs, reqs, citations }), ...checkDiagrams(diagrams)];
}

if (process.argv[1]?.endsWith('cli.ts')) {
  const problems = runTraceability(process.cwd());
  if (problems.length === 0) {
    console.log('✓ traceability ok');
    process.exit(0);
  } else {
    for (const problem of problems) {
      console.error(`✗ ${problem}`);
    }
    process.exit(1);
  }
}
