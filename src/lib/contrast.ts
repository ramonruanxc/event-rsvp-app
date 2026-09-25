/** Gamma-encoded sRGB channels, each in the range 0..1. */
export type Rgb = readonly [number, number, number];

/** Converts an OKLCH color to gamma-encoded sRGB (Björn Ottosson's OKLab matrices). */
export function oklchToSrgb(l: number, c: number, h: number): Rgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
  const encode = (x: number) => {
    const v = Math.min(1, Math.max(0, x));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  };
  return [encode(linear[0]), encode(linear[1]), encode(linear[2])];
}

/** WCAG 2.x relative luminance of a gamma-encoded sRGB color. */
export function relativeLuminance([r, g, b]: Rgb): number {
  const linearize = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** WCAG contrast ratio between two gamma-encoded sRGB colors. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Reads the OKLCH and var() custom properties of one theme's `[data-theme]` block. */
export function readThemeTokens(css: string, theme: 'dark' | 'light'): Record<string, Rgb> {
  const blockPattern = new RegExp(`\\[data-theme=['"]${theme}['"]\\]\\s*\\{([^}]*)\\}`);
  const match = css.match(blockPattern);
  if (!match) throw new Error(`No [data-theme='${theme}'] block`);
  const block = match[1];

  const tokens: Record<string, Rgb> = {};

  const oklchPattern = /--([a-z0-9-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)\s*;/g;
  for (const m of block.matchAll(oklchPattern)) {
    const [, name, l, c, h] = m;
    tokens[name] = oklchToSrgb(Number(l), Number(c), Number(h));
  }

  const varPattern = /--([a-z0-9-]+):\s*var\(--([a-z0-9-]+)\)\s*;/g;
  for (const m of block.matchAll(varPattern)) {
    const [, name, ref] = m;
    if (!(ref in tokens)) throw new Error(`--${name} refers to unknown --${ref}`);
    tokens[name] = tokens[ref];
  }

  return tokens;
}
