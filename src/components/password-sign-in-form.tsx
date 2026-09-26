'use client';

import { useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ValidationError, type FieldErrors } from '@/domain/errors';
import { signInInputSchema, type SignInFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';
import { focusFirstInvalid } from '@/lib/focus';
import {
  Alert,
  describedBy,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';

/** Maps PasswordSignInForm field names to their control ids (REQ-137). */
const SIGN_IN_FIELD_IDS = { email: 'signin-email', password: 'signin-password' } as const;

/** Props of {@link PasswordSignInForm}. */
export interface PasswordSignInFormProps {
  callbackUrl: string;
  submit: (
    values: SignInFormValues,
    callbackUrl: string,
  ) => Promise<ActionResult<{ redirectTo: string }>>;
  navigate?: (url: string) => void;
}

/** Email/password sign-in form (REQ-126, REQ-118, REQ-119). */
export function PasswordSignInForm({
  callbackUrl,
  submit,
  navigate = (url) => window.location.assign(url),
}: PasswordSignInFormProps): React.JSX.Element {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function errorFor(field: 'email' | 'password'): string | null {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  }

  /** Shows field errors, then focuses the first invalid field (REQ-137). */
  function showFieldErrors(errors: FieldErrors) {
    flushSync(() => {
      setFieldErrors(errors);
      setFormError(null);
    });
    focusFirstInvalid(formRef.current, errors, SIGN_IN_FIELD_IDS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signInInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      showFieldErrors(ValidationError.fromZod(parsed.error).fieldErrors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await submit(parsed.data, callbackUrl);
    if (result.ok) {
      navigate(result.data.redirectTo);
      return;
    }
    setSubmitting(false);
    if (result.code === 'VALIDATION_ERROR') {
      showFieldErrors(result.fieldErrors ?? {});
      return;
    }
    if (result.code === 'INVALID_CREDENTIALS') setPassword('');
    setFormError(
      result.code === 'RATE_LIMITED' ? t('auth.tooManyAttempts') : t(`errors.${result.code}`),
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {formError && <Alert>{formError}</Alert>}
      <Field>
        <FieldLabel htmlFor="signin-email">{t('auth.email')}</FieldLabel>
        <input
          className="input"
          id="signin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={fieldErrors.email ? 'true' : undefined}
          aria-describedby={describedBy(fieldErrors.email && 'signin-email-error')}
        />
        {errorFor('email') && <FieldError id="signin-email-error">{errorFor('email')}</FieldError>}
      </Field>
      <Field>
        <FieldLabel htmlFor="signin-password">{t('auth.password')}</FieldLabel>
        <input
          className="input"
          id="signin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={fieldErrors.password ? 'true' : undefined}
          aria-describedby={describedBy(
            'signin-password-hint',
            fieldErrors.password && 'signin-password-error',
          )}
        />
        <FieldHint id="signin-password-hint">{t('auth.forgotPasswordHint')}</FieldHint>
        {errorFor('password') && (
          <FieldError id="signin-password-error">{errorFor('password')}</FieldError>
        )}
      </Field>
      <div className="form-foot">
        <Button type="submit" variant="primary" loading={submitting}>
          {t('auth.signInSubmit')}
        </Button>
      </div>
    </form>
  );
}
