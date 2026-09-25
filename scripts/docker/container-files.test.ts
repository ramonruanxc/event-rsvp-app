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

/** The `db` service exactly as before Phase 9 (REQ-112: `docker compose up -d db` is unchanged). */
const DB_SERVICE = `  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: rsvp
      POSTGRES_PASSWORD: rsvp
      POSTGRES_DB: rsvp
    ports: ['5432:5432']
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql:ro
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U rsvp']
      interval: 5s
      timeout: 5s
      retries: 10
`;

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

describe('compose stack (REQ-112)', () => {
  it('REQ-112: the app service builds the image, waits for a healthy db and publishes APP_PORT', () => {
    const compose = lines('docker-compose.yml');
    for (const line of [
      'app:',
      'build: .',
      'init: true',
      'condition: service_healthy',
      "ports: ['${APP_PORT:-3000}:3000']",
      'start_period: 60s',
    ]) {
      expect(compose, line).toContain(line);
    }
  });

  it('REQ-112: .env.local is optional and the database URLs point to the db service', () => {
    const compose = lines('docker-compose.yml');
    for (const line of [
      '- path: .env.local',
      'required: false',
      'DATABASE_URL: postgresql://rsvp:rsvp@db:5432/rsvp',
      'DATABASE_URL_UNPOOLED: postgresql://rsvp:rsvp@db:5432/rsvp',
      "AUTH_TRUST_HOST: 'true'",
    ]) {
      expect(compose, line).toContain(line);
    }
    expect(read('docker-compose.yml')).not.toContain('AUTH_SECRET');
  });

  it('REQ-112: docker compose up -d db still starts only the unchanged database service', () => {
    const text = read('docker-compose.yml');
    const db = text.slice(text.indexOf('  db:\n'), text.indexOf('  app:\n'));
    expect(db).toBe(DB_SERVICE);
  });
});
