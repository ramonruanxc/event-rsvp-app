/** Value of `name` in a dotenv file (last occurrence, surrounding quotes removed); undefined when absent or empty. */
export function readEnvValue(content: string, name: string): string | undefined {
  const prefix = `${name}=`;
  let value: string | undefined;
  for (const line of content.split(/\r?\n/))
    if (line.startsWith(prefix)) value = line.slice(prefix.length).trim();
  if (value === undefined) return undefined;
  const unquoted = value.replace(/^(['"])(.*)\1$/, '$2');
  return unquoted === '' ? undefined : unquoted;
}

/** Sets `name=value` in a dotenv file: replaces every line of that variable, or appends one; keeps the line ending. */
export function upsertEnvValue(content: string, name: string, value: string): string {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content === '' ? [] : content.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  const prefix = `${name}=`;
  let found = false;
  const updated = lines.map((line) => {
    if (!line.startsWith(prefix)) return line;
    found = true;
    return `${name}=${value}`;
  });
  if (!found) updated.push(`${name}=${value}`);
  return updated.join(eol) + eol;
}
