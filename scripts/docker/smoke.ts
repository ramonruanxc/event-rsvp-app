/** Slug of the seeded demo event; the REQ-113 test keeps it equal to DEMO_SLUG. */
export const SMOKE_SLUG = 'demoPicnic';

/** One GET request the smoke check sends to the running stack (REQ-113). */
export interface SmokeCheck {
  path: string;
  contentType?: string;
}

/** Home page, seeded demo event page and its .ics download (REQ-113). */
export const SMOKE_CHECKS: readonly SmokeCheck[] = [
  { path: '/en' },
  { path: `/en/e/${SMOKE_SLUG}` },
  { path: `/e/${SMOKE_SLUG}/calendar.ics`, contentType: 'text/calendar' },
];

/** URL of the app published by docker compose: `http://localhost:<APP_PORT or 3000>` (REQ-113). */
export function smokeBaseUrl(env: Record<string, string | undefined>): string {
  return `http://localhost:${env.APP_PORT?.trim() || '3000'}`;
}

/** Sends one check without following redirects; returns its `✓ …` or `✗ …` line. */
async function checkOne(
  baseUrl: string,
  check: SmokeCheck,
  fetchImpl: typeof fetch,
): Promise<string> {
  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}${check.path}`, { redirect: 'manual' });
  } catch (error) {
    return `✗ ${check.path} — request failed: ${error instanceof Error ? error.message : String(error)}`;
  }
  if (response.status !== 200) return `✗ ${check.path} — expected 200, got ${response.status}`;
  const contentType = response.headers.get('content-type') ?? '';
  if (check.contentType && !contentType.startsWith(check.contentType)) {
    return `✗ ${check.path} — expected content-type ${check.contentType}, got ${contentType || 'none'}`;
  }
  return check.contentType ? `✓ ${check.path} 200 ${check.contentType}` : `✓ ${check.path} 200`;
}

/** Runs every SMOKE_CHECKS entry in order; `ok` is true only when every line starts with `✓` (REQ-113). */
export async function runSmoke(
  baseUrl: string,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean; lines: string[] }> {
  const lines: string[] = [];
  for (const check of SMOKE_CHECKS) lines.push(await checkOne(baseUrl, check, fetchImpl));
  return { ok: lines.every((line) => line.startsWith('✓')), lines };
}
