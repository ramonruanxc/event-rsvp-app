// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { Alert, describedBy, Field, FieldError, FieldLabel, NeededBadge } from './field';

describe('field primitives', () => {
  it('REQ-137: FieldError is described text with an icon, not an alert', () => {
    const { container, queryByRole } = renderWithIntl(
      <FieldError id="name-error">This field is required.</FieldError>,
    );
    const error = container.querySelector('#name-error')!;
    expect(error.className).toBe('field-error');
    expect(error.textContent).toBe('This field is required.');
    expect(error.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1);
    expect(queryByRole('alert')).toBeNull();
  });

  it('REQ-69: Alert is an alert with an icon', () => {
    const { getByRole } = renderWithIntl(<Alert>Something went wrong.</Alert>);
    const alert = getByRole('alert');
    expect(alert.className).toBe('alert');
    expect(alert.textContent).toBe('Something went wrong.');
    expect(alert.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1);
  });

  it('REQ-70: NeededBadge shows the word with an alert icon', () => {
    const { getByText } = renderWithIntl(<NeededBadge>Needed</NeededBadge>);
    const badge = getByText('Needed').closest('.micro.needed');
    expect(badge).not.toBeNull();
    expect(badge?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('REQ-68: FieldLabel labels its control and keeps the badge outside the label', () => {
    const { container, getByLabelText } = renderWithIntl(
      <Field missing>
        <FieldLabel htmlFor="date" badge={<NeededBadge>Needed</NeededBadge>}>
          Date
        </FieldLabel>
        <input id="date" />
      </Field>,
    );
    expect(getByLabelText('Date')).toBeInstanceOf(HTMLInputElement);
    expect(container.querySelector('.field.is-missing .label-row label')?.textContent).toBe('Date');
  });

  it('REQ-69: describedBy joins ids and returns undefined when there are none', () => {
    expect(describedBy('a', false, undefined, 'b')).toBe('a b');
    expect(describedBy(false, null)).toBeUndefined();
  });
});
