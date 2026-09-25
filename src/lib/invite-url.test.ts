import { describe, expect, it } from 'vitest';
import { buildInviteUrl } from './invite-url';

describe('buildInviteUrl', () => {
  it('REQ-38: invite URL has no locale', () => {
    expect(buildInviteUrl('https://rsvp.example.com', 'abc123XYZ_')).toBe(
      'https://rsvp.example.com/e/abc123XYZ_',
    );
  });

  it('REQ-38: a trailing slash on the origin gives the same URL', () => {
    expect(buildInviteUrl('https://rsvp.example.com/', 'abc123XYZ_')).toBe(
      'https://rsvp.example.com/e/abc123XYZ_',
    );
  });
});
