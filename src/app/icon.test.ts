import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('favicon', () => {
  it('REQ-76: the favicon is the logo SVG and the old .ico is gone', () => {
    const svg = readFileSync(join(process.cwd(), 'src/app/icon.svg'), 'utf8');
    expect(svg).toContain('#3630B0');
    expect(svg).toContain('#3BDBD1');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(existsSync(join(process.cwd(), 'src/app/favicon.ico'))).toBe(false);
  });
});
