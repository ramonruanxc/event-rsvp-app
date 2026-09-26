// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import type { ActionResult } from '@/lib/action-result';
import { renderWithIntl } from '@/test/render';
import { SetPasswordForm } from './set-password-form';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));

function setup(hasPassword: boolean, result: ActionResult<null> = { ok: true, data: null }) {
  const submit = vi.fn(async () => result);
  const view = renderWithIntl(<SetPasswordForm hasPassword={hasPassword} submit={submit} />);
  const type = (label: string, value: string) =>
    fireEvent.change(view.getByLabelText(label), { target: { value } });
  const save = () => fireEvent.click(view.getByRole('button', { name: 'Save password' }));
  return { ...view, submit, type, save };
}

describe('SetPasswordForm', () => {
  it('REQ-128: without a password it offers "Set a password" and no current-password field', () => {
    const { getByRole, getByText, queryByLabelText, getByLabelText } = setup(false);
    expect(getByRole('heading', { level: 2, name: 'Set a password' })).not.toBeNull();
    expect(getByText('Add a password to also sign in with your email.')).not.toBeNull();
    expect(queryByLabelText('Current password')).toBeNull();
    expect(getByLabelText('New password').getAttribute('autocomplete')).toBe('new-password');
    expect(getByLabelText('New password').getAttribute('aria-describedby')).toContain(
      'account-new-hint',
    );
    expect(getByLabelText('Confirm new password').getAttribute('autocomplete')).toBe(
      'new-password',
    );
  });

  it('REQ-128: with a password it asks for the current one first', async () => {
    const { getByRole, getByLabelText, type, save, findByText, submit } = setup(true);
    expect(getByRole('heading', { level: 2, name: 'Change password' })).not.toBeNull();
    expect(getByLabelText('Current password').getAttribute('autocomplete')).toBe(
      'current-password',
    );
    type('New password', 'new horse 12');
    type('Confirm new password', 'new horse 12');
    save();
    expect(await findByText('This field is required.')).not.toBeNull();
    expect(getByLabelText('Current password').getAttribute('aria-invalid')).toBe('true');
    expect(submit).not.toHaveBeenCalled();
  });

  it('REQ-120: saving shows "Password saved.", empties the fields and refreshes', async () => {
    const { type, save, getByRole, getByLabelText, submit } = setup(true);
    type('Current password', 'correct horse');
    type('New password', 'new horse 12');
    type('Confirm new password', 'new horse 12');
    save();
    await waitFor(() => expect(getByRole('status').textContent).toBe('Password saved.'));
    expect(submit).toHaveBeenCalledWith({
      currentPassword: 'correct horse',
      newPassword: 'new horse 12',
      confirmPassword: 'new horse 12',
    });
    for (const label of ['Current password', 'New password', 'Confirm new password']) {
      expect((getByLabelText(label) as HTMLInputElement).value, label).toBe('');
    }
    await waitFor(() => expect(nav.refresh).toHaveBeenCalled());
  });

  it('REQ-120: server field errors show under their fields', async () => {
    const { type, save, findByText } = setup(true, {
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { currentPassword: 'currentPasswordIncorrect' },
    });
    type('Current password', 'wrong');
    type('New password', 'new horse 12');
    type('Confirm new password', 'new horse 12');
    save();
    const error = await findByText('The current password is incorrect.');
    expect(error.closest('[id]')?.id).toBe('account-current-error');
  });

  it('REQ-136: the status region exists before saving, so "Password saved." is announced', () => {
    const { getByRole } = setup(true);
    expect(getByRole('status').textContent).toBe('');
  });
});
