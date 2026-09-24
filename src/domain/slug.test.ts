import { describe, expect, it } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('REQ-11: slug is 10 URL-safe characters', () => {
    expect(generateSlug()).toMatch(/^[A-Za-z0-9_-]{10}$/);
  });

  it('REQ-11: 1000 slugs are all different', () => {
    const slugs = new Set(Array.from({ length: 1000 }, () => generateSlug()));
    expect(slugs.size).toBe(1000);
  });
});
