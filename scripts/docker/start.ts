import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { runStart, type Env, type StartStep } from './start-plan';

let current: ChildProcess | undefined;
let stopping = false;

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    stopping = true;
    if (current) current.kill(signal);
    else process.exit(0);
  });
}

/** Runs one start step as a child process on this terminal; resolves with its exit code. */
function run(step: StartStep, env: Env): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(step.command, step.args, {
      env: env as NodeJS.ProcessEnv,
      stdio: 'inherit',
    });
    current = child;
    child.on('error', (error) => {
      console.error(`start: ${step.name} could not start: ${error.message}`);
      resolve(1);
    });
    child.on('exit', (code) => {
      current = undefined;
      if (stopping) process.exit(0);
      resolve(code ?? 1);
    });
  });
}

void runStart({
  env: process.env,
  generateSecret: () => randomBytes(32).toString('base64'),
  run,
  log: (line) => console.log(line),
}).then((code) => process.exit(code));
