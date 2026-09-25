import { describe, expect, it, vi } from 'vitest';
import {
  GENERATED_SECRET_NOTICE,
  START_STEPS,
  runStart,
  withAuthSecret,
  type Env,
  type StartStep,
} from './start-plan';

/** Fake step runner: records each step and its env, answers `codes[step.name]` (default 0). */
function fakeRun(codes: Partial<Record<StartStep['name'], number>> = {}) {
  const calls: { name: string; env: Env }[] = [];
  const run = async (step: StartStep, env: Env) => {
    calls.push({ name: step.name, env });
    return codes[step.name] ?? 0;
  };
  return { run, calls };
}

describe('withAuthSecret (REQ-109)', () => {
  it('REQ-109: generates AUTH_SECRET when it is missing or blank', () => {
    for (const given of [{}, { AUTH_SECRET: '' }, { AUTH_SECRET: '   ' }]) {
      const input: Env = { ...given, PATH: '/usr/bin' };
      expect(
        withAuthSecret(input, () => 'generated-secret'),
        JSON.stringify(given),
      ).toEqual({
        env: { PATH: '/usr/bin', AUTH_SECRET: 'generated-secret' },
        generated: true,
      });
      expect(input).toEqual({ ...given, PATH: '/usr/bin' });
    }
  });

  it('REQ-109: keeps a supplied AUTH_SECRET and never calls the generator', () => {
    const generate = vi.fn(() => 'generated-secret');
    expect(withAuthSecret({ AUTH_SECRET: 'from-env-local', PATH: '/usr/bin' }, generate)).toEqual({
      env: { AUTH_SECRET: 'from-env-local', PATH: '/usr/bin' },
      generated: false,
    });
    expect(generate).not.toHaveBeenCalled();
  });
});

describe('runStart (REQ-108, REQ-109)', () => {
  it('REQ-108: migrates, then seeds, then serves, each with the same environment', async () => {
    expect(START_STEPS).toEqual([
      { name: 'migrate', command: 'prisma', args: ['migrate', 'deploy'] },
      { name: 'seed', command: 'prisma', args: ['db', 'seed'] },
      { name: 'serve', command: 'next', args: ['start', '-H', '0.0.0.0', '-p', '3000'] },
    ]);
    const env: Env = { AUTH_SECRET: 's', DATABASE_URL: 'postgresql://rsvp:rsvp@db:5432/rsvp' };
    const { run, calls } = fakeRun();
    const log: string[] = [];

    const code = await runStart({
      env,
      generateSecret: () => 'unused',
      run,
      log: (l) => log.push(l),
    });

    expect(code).toBe(0);
    expect(calls.map((c) => c.name)).toEqual(['migrate', 'seed', 'serve']);
    for (const call of calls) expect(call.env).toEqual(env);
    expect(log).toEqual(['start: migrate', 'start: seed', 'start: serve']);
  });

  it('REQ-108: never serves when the migrations or the seed fail', async () => {
    const env: Env = { AUTH_SECRET: 's' };
    const migrate = fakeRun({ migrate: 3 });
    const log: string[] = [];
    const code = await runStart({
      env,
      generateSecret: () => 'x',
      run: migrate.run,
      log: (l) => log.push(l),
    });
    expect(code).toBe(3);
    expect(migrate.calls.map((c) => c.name)).toEqual(['migrate']);
    expect(log).toEqual(['start: migrate', 'start: migrate failed with exit code 3']);

    const seed = fakeRun({ seed: 1 });
    expect(await runStart({ env, generateSecret: () => 'x', run: seed.run, log: () => {} })).toBe(
      1,
    );
    expect(seed.calls.map((c) => c.name)).toEqual(['migrate', 'seed']);
  });

  it('REQ-109: generates the secret once, passes it to every step and never logs it', async () => {
    const { run, calls } = fakeRun();
    const log: string[] = [];

    await runStart({
      env: {},
      generateSecret: () => 'generated-secret-value',
      run,
      log: (l) => log.push(l),
    });

    expect(log).toEqual([GENERATED_SECRET_NOTICE, 'start: migrate', 'start: seed', 'start: serve']);
    for (const call of calls) expect(call.env.AUTH_SECRET).toBe('generated-secret-value');
    expect(log.filter((line) => line.includes('generated-secret-value'))).toEqual([]);

    const supplied: string[] = [];
    const env: Env = { AUTH_SECRET: 'from-env-local' };
    await runStart({ env, generateSecret: () => 'x', run, log: (l) => supplied.push(l) });
    expect(supplied).toEqual(['start: migrate', 'start: seed', 'start: serve']);
  });
});
