/** Returns the avatar initial from the user's name, falling back to their email or `'?'` (REQ-80). */
export function userInitial(name: string | null, email: string | null): string {
  const source = (name ?? '').trim() || (email ?? '').trim();
  return source ? Array.from(source)[0].toLocaleUpperCase() : '?';
}
