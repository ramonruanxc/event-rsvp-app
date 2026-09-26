// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import type { ActionResult } from '@/lib/action-result';
import { renderWithIntl } from '@/test/render';
import { PasswordSignInForm } from './password-sign-in-form';

function setup(result: ActionResult<{ redirectTo: string }>) {
  const submit = vi.fn(async () => result);
  const navigate = vi.fn();
  const view = renderWithIntl(
    <PasswordSignInForm callbackUrl="/en/events/new" submit={submit} navigate={navigate} />,
  );
  const fill = (email: string, password: string) => {
    fireEvent.change(view.getByLabelText('Email'), { target: { value: email } });
    fireEvent.change(view.getByLabelText('Password'), { target: { value: password } });
    fireEvent.click(view.getByRole('button', { name: 'Sign in' }));
  };
  return { ...view, submit, navigate, fill };
}

const ok: ActionResult<{ redirectTo: string }> = {
  ok: true,
  data: { redirectTo: '/en/events/new' },
};

describe('PasswordSignInForm', () => {
  it('REQ-126: has labelled email and password inputs and a Sign in button', () => {
    const { getByLabelText, getByRole } = setup(ok);
    const email = getByLabelText('Email');
    expect(email.id).toBe('signin-email');
    expect(email.getAttribute('type')).toBe('email');
    expect(email.getAttribute('autocomplete')).toBe('email');
    const password = getByLabelText('Password');
    expect(password.id).toBe('signin-password');
    expect(password.getAttribute('type')).toBe('password');
    expect(password.getAttribute('autocomplete')).toBe('current-password');
    expect(getByRole('button', { name: 'Sign in' }).getAttribute('type')).toBe('submit');
  });

  it('REQ-126: empty fields show required errors and nothing is sent', async () => {
    const { fill, findAllByText, getByLabelText, submit } = setup(ok);
    fill('', '');
    expect(await findAllByText('This field is required.')).toHaveLength(2);
    expect(getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
    expect(getByLabelText('Email').getAttribute('aria-describedby')).toContain(
      'signin-email-error',
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it('REQ-118: sends the normalized values with the callback, then navigates', async () => {
    const { fill, submit, navigate } = setup(ok);
    fill(' Ana@Example.com ', 'correct horse');
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/en/events/new'));
    expect(submit).toHaveBeenCalledWith(
      { email: 'ana@example.com', password: 'correct horse' },
      '/en/events/new',
    );
  });

  it('REQ-118: a failed sign-in shows the generic error, empties the password and keeps the email', async () => {
    const { fill, findByRole, getByLabelText, navigate } = setup({
      ok: false,
      code: 'INVALID_CREDENTIALS',
    });
    fill('ana@example.com', 'wrong horse');
    expect((await findByRole('alert')).textContent).toBe('Email or password is incorrect.');
    expect((getByLabelText('Password') as HTMLInputElement).value).toBe('');
    expect((getByLabelText('Email') as HTMLInputElement).value).toBe('ana@example.com');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('REQ-119: the rate limit shows the retry message', async () => {
    const { fill, findByRole } = setup({ ok: false, code: 'RATE_LIMITED' });
    fill('ana@example.com', 'correct horse');
    expect((await findByRole('alert')).textContent).toBe(
      'Too many attempts — please try again in a few minutes.',
    );
  });

  it('REQ-137: empty fields focus Email first', () => {
    const { fill, getByLabelText } = setup(ok);
    fill('', '');
    expect(document.activeElement).toBe(getByLabelText('Email'));
  });
});
