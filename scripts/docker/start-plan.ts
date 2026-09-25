/** Environment variables as the app container sees them. */
export type Env = Record<string, string | undefined>;

/** One command the app container runs at start (REQ-108). */
export interface StartStep {
  name: 'migrate' | 'seed' | 'serve';
  command: string;
  args: string[];
}

/** Start steps in order: migrations, then the idempotent demo seed, then the server (REQ-108). */
export const START_STEPS: readonly StartStep[] = [
  { name: 'migrate', command: 'prisma', args: ['migrate', 'deploy'] },
  { name: 'seed', command: 'prisma', args: ['db', 'seed'] },
  { name: 'serve', command: 'next', args: ['start', '-H', '0.0.0.0', '-p', '3000'] },
];

/** Logged when AUTH_SECRET was generated; it never contains the secret itself (REQ-109). */
export const GENERATED_SECRET_NOTICE =
  'start: AUTH_SECRET is not set, generated one for this container run (sign-in sessions end when the container restarts)';

/** Copy of `env` with AUTH_SECRET set: the supplied non-blank value, else a generated one (REQ-109). */
export function withAuthSecret(env: Env, generate: () => string): { env: Env; generated: boolean } {
  if (env.AUTH_SECRET?.trim()) return { env: { ...env }, generated: false };
  return { env: { ...env, AUTH_SECRET: generate() }, generated: true };
}

/** Everything runStart needs from the outside world (REQ-108). */
export interface StartDeps {
  env: Env;
  generateSecret: () => string;
  run: (step: StartStep, env: Env) => Promise<number>;
  log: (line: string) => void;
}

/** Runs START_STEPS in order with AUTH_SECRET ensured; stops at the first failing step and returns its code (REQ-108, REQ-109). */
export async function runStart(deps: StartDeps): Promise<number> {
  const { env, generated } = withAuthSecret(deps.env, deps.generateSecret);
  if (generated) deps.log(GENERATED_SECRET_NOTICE);
  for (const step of START_STEPS) {
    deps.log(`start: ${step.name}`);
    const code = await deps.run(step, env);
    if (code !== 0) {
      deps.log(`start: ${step.name} failed with exit code ${code}`);
      return code;
    }
  }
  return 0;
}
