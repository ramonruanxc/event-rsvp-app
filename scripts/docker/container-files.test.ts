import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** File text with LF line endings. */
const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
/** Trimmed, non-empty lines of a file. */
const lines = (path: string) =>
  read(path)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

describe('app image (REQ-108, REQ-111)', () => {
  it('REQ-108: the app container starts through the start script', () => {
    expect(lines('Dockerfile').at(-1)).toBe(
      'CMD ["node", "--import", "tsx", "scripts/docker/start.ts"]',
    );
  });

  it('REQ-111: the image is built on Node 22 with the full next build, Vercel build unchanged', () => {
    const dockerfile = lines('Dockerfile');
    expect(dockerfile[0]).toBe('FROM node:22-bookworm-slim');
    expect(dockerfile).toContain('RUN npm ci');
    expect(dockerfile).toContain('RUN npm run build');
    expect(read('Dockerfile')).not.toMatch(/standalone|vercel-build/);
    expect(read('next.config.ts')).not.toMatch(/\boutput\s*:/);
    const { scripts } = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(scripts.build).toBe('next build');
    expect(scripts['vercel-build']).toBe(
      'prisma generate && prisma migrate deploy && prisma db seed && next build',
    );
  });

  it('REQ-111: no secret and no env file goes into the image', () => {
    expect(lines('.dockerignore')).toEqual(
      expect.arrayContaining(['.env*', '.git', 'node_modules', '.next']),
    );
    const dockerfile = lines('Dockerfile');
    expect(dockerfile.filter((l) => /^(ARG|ENV)\b.*(SECRET|KEY|TOKEN|PASSWORD)/i.test(l))).toEqual(
      [],
    );
    expect(dockerfile.filter((l) => l.includes('.env'))).toEqual([]);
  });
});
