import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AI_TIMEOUT_MS } from '@/lib/ai/types';

/** Next.js requires route segment config (e.g. `maxDuration`) to be a static literal, so it is
 * verified by parsing the source text rather than importing the page module. */
const pageSource = readFileSync('src/app/[locale]/events/new/page.tsx', 'utf8');

describe('new-event page function duration (REQ-133)', () => {
  it('REQ-133: the new-event page allows the function to run longer than the AI budget', () => {
    const match = pageSource.match(/export const maxDuration = (\d+);/);

    expect(match).not.toBeNull();
    const maxDurationSeconds = Number(match?.[1]);
    expect(maxDurationSeconds * 1000).toBeGreaterThanOrEqual(AI_TIMEOUT_MS + 5000);
  });
});
