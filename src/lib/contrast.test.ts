import { describe, expect, it } from 'vitest';
import { contrastRatio, oklchToSrgb, readThemeTokens } from './contrast';

describe('contrast', () => {
  it('REQ-65: sRGB red round-trips from its OKLCH coordinates', () => {
    const [r, g, b] = oklchToSrgb(0.6279553606145516, 0.25768330773615683, 29.2338851923426);
    expect(r).toBeCloseTo(1, 4);
    expect(g).toBeCloseTo(0, 4);
    expect(b).toBeCloseTo(0, 4);
  });

  it('REQ-65: white on black is 21:1 and #767676 on white is 4.54:1', () => {
    expect(contrastRatio([1, 1, 1], [0, 0, 0])).toBeCloseTo(21, 6);
    const g = 0x76 / 255;
    expect(contrastRatio([g, g, g], [1, 1, 1])).toBeCloseTo(4.54, 2);
  });

  it('REQ-65: readThemeTokens reads OKLCH and var() tokens of one theme', () => {
    const css = `:root,\n[data-theme='dark'] {\n  color-scheme: dark;\n  --bg: oklch(0 0 0);\n  --text: oklch(1 0 0);\n  --on-danger: var(--bg);\n  --shadow-pop: 0 1px 2px oklch(0.1 0.02 277 / 0.4);\n}\n[data-theme="light"] {\n  --bg: oklch(1 0 0);\n}\n`;
    const dark = readThemeTokens(css, 'dark');
    expect(Object.keys(dark).sort()).toEqual(['bg', 'on-danger', 'text']);
    dark.text.forEach((channel) => expect(channel).toBeCloseTo(1, 4));
    expect(dark['on-danger']).toEqual(dark.bg);

    const light = readThemeTokens(css, 'light');
    light.bg.forEach((channel) => expect(channel).toBeCloseTo(1, 4));

    expect(() => readThemeTokens('', 'dark')).toThrow(/data-theme='dark'/);
  });
});
