/** Gamma-encoded sRGB channels, each in the range 0..1. */
export type Rgb = readonly [number, number, number];

/** Converts an OKLCH color to gamma-encoded sRGB (Björn Ottosson's OKLab matrices). */
export function oklchToSrgb(_l: number, _c: number, _h: number): Rgb {
  throw new Error('not implemented');
}

/** WCAG 2.x relative luminance of a gamma-encoded sRGB color. */
export function relativeLuminance(_rgb: Rgb): number {
  throw new Error('not implemented');
}

/** WCAG contrast ratio between two gamma-encoded sRGB colors. */
export function contrastRatio(_a: Rgb, _b: Rgb): number {
  throw new Error('not implemented');
}

/** Reads the OKLCH and var() custom properties of one theme's `[data-theme]` block. */
export function readThemeTokens(_css: string, _theme: 'dark' | 'light'): Record<string, Rgb> {
  throw new Error('not implemented');
}
