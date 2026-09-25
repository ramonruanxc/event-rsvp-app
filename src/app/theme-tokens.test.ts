import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, readThemeTokens, type Rgb } from '@/lib/contrast';

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

const TEXT_PAIRS: Array<[string, string]> = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surface-2'],
  ['text-muted', 'bg'],
  ['text-muted', 'surface'],
  ['text-muted', 'surface-2'],
  ['on-primary', 'primary'],
  ['on-primary', 'primary-hover'],
  ['link', 'bg'],
  ['link', 'surface'],
  ['link', 'surface-2'],
  ['success', 'bg'],
  ['success', 'surface'],
  ['success', 'success-bg'],
  ['text', 'success-bg'],
  ['warning', 'bg'],
  ['warning', 'surface-2'],
  ['warning', 'warning-bg'],
  ['text', 'warning-bg'],
  ['danger', 'bg'],
  ['danger', 'surface'],
  ['danger', 'danger-bg'],
  ['text', 'danger-bg'],
  ['on-danger', 'danger'],
  ['bg', 'success'],
];

const UI_PAIRS: Array<[string, string]> = [
  ['border-input', 'bg'],
  ['border-input', 'surface'],
  ['border-input', 'surface-2'],
  ['link', 'bg'],
  ['link', 'surface'],
  ['link', 'surface-2'],
  ['primary', 'bg'],
  ['primary', 'surface'],
];

/** Pairs of `theme` below `min`, as "fg/bg ratio" (or "fg/bg missing"); empty means the theme passes. */
function failures(theme: 'dark' | 'light', pairs: Array<[string, string]>, min: number): string[] {
  const tokens = readThemeTokens(css, theme);
  const results: string[] = [];
  for (const [fg, bg] of pairs) {
    const fgRgb: Rgb | undefined = tokens[fg];
    const bgRgb: Rgb | undefined = tokens[bg];
    if (!fgRgb || !bgRgb) {
      results.push(`${fg}/${bg} missing`);
      continue;
    }
    const ratio = contrastRatio(fgRgb, bgRgb);
    if (ratio < min) results.push(`${fg}/${bg} ${ratio.toFixed(2)}`);
  }
  return results;
}

describe('theme tokens', () => {
  it('REQ-65: text pairs are at least 4.5:1 in the dark and the light theme', () => {
    expect({
      dark: failures('dark', TEXT_PAIRS, 4.5),
      light: failures('light', TEXT_PAIRS, 4.5),
    }).toEqual({
      dark: [],
      light: [],
    });
  });

  it('REQ-65: UI boundary pairs are at least 3:1 in the dark and the light theme', () => {
    expect({ dark: failures('dark', UI_PAIRS, 3), light: failures('light', UI_PAIRS, 3) }).toEqual({
      dark: [],
      light: [],
    });
  });
});
