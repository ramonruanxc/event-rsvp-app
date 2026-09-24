/** Escapes backslash, semicolon, comma and newline characters for an iCalendar TEXT value (REQ-41). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

const MAX_LINE_OCTETS = 75;

/** Folds a physical iCalendar line so no octet-line exceeds 75 octets (RFC 5545 §3.1, REQ-41). */
export function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let currentOctets = 0;

  for (const char of line) {
    const charOctets = Buffer.byteLength(char, 'utf8');
    if (currentOctets + charOctets > MAX_LINE_OCTETS) {
      parts.push(current);
      current = ' ';
      currentOctets = 1;
    }
    current += char;
    currentOctets += charOctets;
  }
  parts.push(current);

  return parts.join('\r\n');
}
