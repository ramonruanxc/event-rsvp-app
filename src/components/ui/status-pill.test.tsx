// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { StatusPill, type PillStatus } from './status-pill';

const cases: Array<[PillStatus, string, string]> = [
  ['going', 'Going', 'lucide-check'],
  ['declined', 'Declined', 'lucide-x'],
  ['ended', 'Ended', 'lucide-clock'],
];

describe('StatusPill', () => {
  it.each(cases)('REQ-70: %s pill has an icon and the word %s', (status, word, iconClass) => {
    const { getByText } = renderWithIntl(<StatusPill status={status}>{word}</StatusPill>);
    const pill = getByText(word);
    expect(pill.className).toBe(`pill pill-${status}`);
    expect(pill.querySelector(`svg.${iconClass}[aria-hidden="true"]`)).not.toBeNull();
  });
});
