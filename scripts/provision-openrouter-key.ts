/** `npm run openrouter:key` — provisions the OpenRouter API key with a spend limit (REQ-98). Never prints secrets. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { runProvisionCli } from './openrouter-keys/cli';

void runProvisionCli({
  argv: process.argv.slice(2),
  env: process.env,
  fetch: (url, init) => fetch(url, init),
  readFile: (path) => (existsSync(path) ? readFileSync(path, 'utf8') : undefined),
  writeFile: (path, content) => writeFileSync(path, content, { encoding: 'utf8', mode: 0o600 }),
  out: (line) => console.log(line),
  err: (line) => console.error(line),
}).then((code) => process.exit(code));
