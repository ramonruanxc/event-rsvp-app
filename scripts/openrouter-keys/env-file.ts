/** Value of `name` in a dotenv file (last occurrence, surrounding quotes removed); undefined when absent or empty. */
export function readEnvValue(_content: string, _name: string): string | undefined {
  throw new Error('not implemented');
}

/** Sets `name=value` in a dotenv file: replaces every line of that variable, or appends one; keeps the line ending. */
export function upsertEnvValue(_content: string, _name: string, _value: string): string {
  throw new Error('not implemented');
}
