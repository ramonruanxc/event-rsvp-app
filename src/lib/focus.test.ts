// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { focusFirstInvalid } from './focus';

afterEach(() => {
  document.body.innerHTML = '';
});

/** A form with a name input, a notes textarea, a date input and a zone select, in that order. */
function form(): HTMLFormElement {
  const element = document.createElement('form');
  element.innerHTML =
    '<input id="f-name" /><textarea id="f-notes"></textarea><input id="f-date" /><select id="f-zone"></select>';
  document.body.appendChild(element);
  return element;
}

describe('focusFirstInvalid (REQ-137)', () => {
  const ids = { name: 'f-name', notes: 'f-notes', date: 'f-date', timezone: 'f-zone' };

  it('REQ-137: focuses the first control in document order, not in error-key order', () => {
    const root = form();

    const focused = focusFirstInvalid(root, { timezone: 'invalidTimezone', date: 'inPast' }, ids);

    expect(focused).toBe(true);
    expect(document.activeElement?.id).toBe('f-date');
  });

  it('REQ-137: ignores errors without a mapped control and returns false when nothing matches', () => {
    const root = form();

    expect(focusFirstInvalid(root, { form: 'invalidFormat' }, ids)).toBe(false);
    expect(document.activeElement).toBe(document.body);
    expect(focusFirstInvalid(null, { name: 'required' }, ids)).toBe(false);
  });
});
