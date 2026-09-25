import type { Page } from '@playwright/test';

/** One recorded focus outline, read from the computed style of the focused (or related) element. */
export interface FocusRing {
  element: string;
  style: string;
  width: string;
}

/** Presses Tab until the focused element matches `selector`; throws after 40 presses. */
export async function tabTo(page: Page, selector: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const matches = await page.evaluate((sel) => {
      const el = document.activeElement;
      return el instanceof Element && el.matches(sel);
    }, selector);
    if (matches) return;
  }
  throw new Error(`tabTo: no element matching "${selector}" was focused after 40 Tab presses`);
}

/** Presses Tab through the page (max 60 presses, stops when focus returns to <body>) and returns each focus ring. */
export async function focusRings(page: Page): Promise<FocusRing[]> {
  const rings: FocusRing[] = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const target = el.matches('.seg input') ? el.nextElementSibling : el;
      if (!target) return null;
      const style = getComputedStyle(target);
      return {
        element: el.outerHTML.slice(0, 80),
        style: style.outlineStyle,
        width: style.outlineWidth,
      };
    });
    if (!ring) break;
    rings.push(ring);
  }
  return rings;
}
