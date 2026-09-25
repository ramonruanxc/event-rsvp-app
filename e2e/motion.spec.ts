import { test, expect } from '@playwright/test';

test.describe('REQ-74: reduced motion keeps only opacity changes', () => {
  test('REQ-74: movement happens only without a reduced-motion preference', async ({ page }) => {
    const probe = () =>
      page.evaluate(() => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        document.body.append(btn);
        const panel = document.createElement('div');
        panel.className = 'confirm';
        document.body.append(panel);
        const transition = getComputedStyle(btn).transitionProperty;
        const animation = panel.getAnimations()[0];
        const keys = animation
          ? (animation.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k))
          : [];
        btn.remove();
        panel.remove();
        return { transition, keys };
      });

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/en');
    const moving = await probe();
    expect(moving.transition).toBe('background-color, border-color, color, transform');
    expect(moving.keys).toContain('transform');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const still = await probe();
    expect(still.transition).not.toContain('transform');
    expect(still.keys).toContain('opacity');
    expect(still.keys).not.toContain('transform');
  });
});
