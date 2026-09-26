import type { Page } from '@playwright/test';
import * as axe from 'axe-core';

/** Runs the given axe-core rules on the current page and returns the ids of the rules it violates. */
export async function axeViolations(page: Page, rules: string[]): Promise<string[]> {
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(
    (runOnly) => (window as unknown as { axe: typeof axe }).axe.run(document, { runOnly }),
    rules,
  );
  return result.violations.map((violation) => violation.id);
}
