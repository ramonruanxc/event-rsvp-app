// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import type { ActionResult } from '@/lib/action-result';
import { renderWithIntl } from '@/test/render';
import { RegisterForm } from './register-form';

const typed = {
  name: 'Ana Lima',
  email: ' Ana@Example.com ',
  password: 'correct horse',
  confirmPassword: 'correct horse',
};

function setup(result: ActionResult<{ redirectTo: string }>) {
  const submit = vi.fn(async () => result);
  const navigate = vi.fn();
  const view = renderWithIntl(
    <RegisterForm callbackUrl="/en/dashboard" submit={submit} navigate={navigate} />,
  );
  const fill = (values: typeof typed) => {
    fireEvent.change(view.getByLabelText('Name'), { target: { value: values.name } });
    fireEvent.change(view.getByLabelText('Email'), { target: { value: values.email } });
    fireEvent.change(view.getByLabelText('Password'), { target: { value: values.password } });
    fireEvent.change(view.getByLabelText('Confirm password'), {
      target: { value: values.confirmPassword },
    });
    fireEvent.click(view.getByRole('button', { name: 'Create account' }));
  };
  return { ...view, submit, navigate, fill };
}

describe('RegisterForm', () => {
  it('REQ-127: four labelled fields, the password hint and the Create account button', () => {
    const { getByLabelText, getByRole } = setup({
      ok: true,
      data: { redirectTo: '/en/dashboard' },
    });
    expect(getByLabelText('Name').getAttribute('autocomplete')).toBe('name');
    expect(getByLabelText('Email').getAttribute('type')).toBe('email');
    const password = getByLabelText('Password');
    expect(password.getAttribute('type')).toBe('password');
    expect(password.getAttribute('autocomplete')).toBe('new-password');
    expect(password.getAttribute('aria-describedby')).toContain('register-password-hint');
    expect(document.getElementById('register-password-hint')?.textContent).toBe(
      '8 to 128 characters.',
    );
    expect(getByLabelText('Confirm password').getAttribute('autocomplete')).toBe('new-password');
    expect(getByRole('button', { name: 'Create account' }).getAttribute('type')).toBe('submit');
  });

  it('REQ-127: a different confirmation is caught before sending', async () => {
    const { fill, findByText, getByLabelText, submit } = setup({
      ok: true,
      data: { redirectTo: '/' },
    });
    fill({ ...typed, confirmPassword: 'correct horsE' });
    expect(await findByText('The passwords do not match.')).not.toBeNull();
    expect(getByLabelText('Confirm password').getAttribute('aria-invalid')).toBe('true');
    expect(submit).not.toHaveBeenCalled();
  });

  it('REQ-116: sends the typed values with the callback, then navigates', async () => {
    const { fill, submit, navigate } = setup({ ok: true, data: { redirectTo: '/en/dashboard' } });
    fill(typed);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/en/dashboard'));
    // An <input type="email"> strips leading and trailing whitespace on every value assignment (HTML value
    // sanitization, in jsdom and in browsers), so the form only ever holds 'Ana@Example.com'. The case is kept:
    // the action lower-cases it on the server.
    expect(submit).toHaveBeenCalledWith({ ...typed, email: 'Ana@Example.com' }, '/en/dashboard');
  });

  it('REQ-117: refusals and the rate limit show their message and keep the typed values', async () => {
    for (const [code, text] of [
      [
        'GOOGLE_ACCOUNT_EXISTS',
        'This email already has an account that uses Google. Sign in with Google, then set a password in Account.',
      ],
      ['EMAIL_TAKEN', 'An account with this email already exists. Sign in instead.'],
      ['RATE_LIMITED', 'Too many attempts — please try again in a few minutes.'],
    ] as const) {
      const view = setup({ ok: false, code });
      view.fill(typed);
      expect((await view.findByRole('alert')).textContent, code).toBe(text);
      expect((view.getByLabelText('Name') as HTMLInputElement).value).toBe('Ana Lima');
      expect(view.navigate).not.toHaveBeenCalled();
      view.unmount();
    }
  });

  it('REQ-137: a different confirmation focuses Confirm password', () => {
    const { fill, getByLabelText } = setup({ ok: true, data: { redirectTo: '/' } });
    fill({ ...typed, confirmPassword: 'correct horsE' });
    expect(document.activeElement).toBe(getByLabelText('Confirm password'));
  });
});
