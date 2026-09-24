import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatEventDateTime } from './format-date';

describe('formatEventDateTime', () => {
  const instant = new Date('2026-10-02T23:00:00.000Z');
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TZ;
    process.env.TZ = 'Asia/Tokyo';
  });

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('REQ-12: formats for en with a 12-hour clock and the timezone abbreviation', () => {
    const result = formatEventDateTime(instant, 'America/New_York', 'en');
    expect(result).toContain('October 2, 2026');
    expect(result).toMatch(/7:00\sPM/);
    expect(result).toContain('EDT');
  });

  it('REQ-12: formats for fr with a 24-hour clock', () => {
    const result = formatEventDateTime(instant, 'America/New_York', 'fr');
    expect(result).toContain('octobre');
    expect(result).toContain('19:00');
  });

  it('REQ-12: formats for pt-BR with a 24-hour clock', () => {
    const result = formatEventDateTime(instant, 'America/New_York', 'pt-BR');
    expect(result).toContain('outubro');
    expect(result).toContain('19:00');
  });

  it('REQ-12: output does not depend on the machine timezone', () => {
    expect(process.env.TZ).toBe('Asia/Tokyo');
    const result = formatEventDateTime(instant, 'America/New_York', 'en');
    expect(result).toContain('October 2, 2026');
    expect(result).toMatch(/7:00\sPM/);
    expect(result).toContain('EDT');
  });
});
