// @vitest-environment jsdom
import { Check, X } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { SegmentedControl, type SegmentOption } from './segmented-control';

type RsvpStatus = 'GOING' | 'NOT_GOING';

const options: ReadonlyArray<SegmentOption<RsvpStatus>> = [
  { value: 'GOING', label: 'Going', icon: Check, tone: 'success' },
  { value: 'NOT_GOING', label: 'Not going', icon: X, tone: 'muted' },
];

describe('SegmentedControl', () => {
  it('REQ-84: the options form a radio group named by its visible label', () => {
    const onChange = vi.fn();
    const { getByRole, getByLabelText } = renderWithIntl(
      <SegmentedControl
        name="rsvp-status"
        label="Your answer"
        labelId="answer-label"
        value="GOING"
        options={options}
        onChange={onChange}
      />,
    );
    const group = getByRole('radiogroup', { name: 'Your answer' });
    expect(group.querySelectorAll('input[type="radio"]')).toHaveLength(2);
    expect((getByLabelText('Going') as HTMLInputElement).checked).toBe(true);
    expect((getByLabelText('Not going') as HTMLInputElement).checked).toBe(false);
  });

  it('REQ-84: choosing an option reports its value', () => {
    const onChange = vi.fn();
    const { getByLabelText } = renderWithIntl(
      <SegmentedControl
        name="rsvp-status"
        label="Your answer"
        labelId="answer-label"
        value="GOING"
        options={options}
        onChange={onChange}
      />,
    );
    getByLabelText('Not going').click();
    expect(onChange).toHaveBeenCalledWith('NOT_GOING');
  });

  it('REQ-70: each option carries an icon hidden from assistive technology', () => {
    const onChange = vi.fn();
    const { container } = renderWithIntl(
      <SegmentedControl
        name="rsvp-status"
        label="Your answer"
        labelId="answer-label"
        value="GOING"
        options={options}
        onChange={onChange}
      />,
    );
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
    expect(container.querySelector('svg.lucide-check')).not.toBeNull();
    expect(container.querySelector('svg.lucide-x')).not.toBeNull();
  });
});
