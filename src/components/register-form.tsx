'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ValidationError, type FieldErrors } from '@/domain/errors';
import { registerInputSchema, type RegisterFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';
import {
  Alert,
  describedBy,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';

/** Props of {@link RegisterForm}. */
export interface RegisterFormProps {
  callbackUrl: string;
  submit: (
    values: RegisterFormValues,
    callbackUrl: string,
  ) => Promise<ActionResult<{ redirectTo: string }>>;
  navigate?: (url: string) => void;
}

/** Registration form: name, email, password and confirm password (REQ-127, REQ-116, REQ-117). */
export function RegisterForm({
  callbackUrl,
  submit,
  navigate = (url) => window.location.assign(url),
}: RegisterFormProps): React.JSX.Element {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function errorFor(field: 'name' | 'email' | 'password' | 'confirmPassword'): string | null {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: RegisterFormValues = { name, email, password, confirmPassword };
    const parsed = registerInputSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(ValidationError.fromZod(parsed.error).fieldErrors);
      setFormError(null);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await submit(values, callbackUrl);
    setSubmitting(false);
    if (result.ok) {
      navigate(result.data.redirectTo);
      return;
    }
    if (result.code === 'VALIDATION_ERROR') {
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    setFormError(
      result.code === 'RATE_LIMITED' ? t('auth.tooManyAttempts') : t(`errors.${result.code}`),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <Alert>{formError}</Alert>}
      <Field>
        <FieldLabel htmlFor="register-name">{t('auth.name')}</FieldLabel>
        <input
          className="input"
          id="register-name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={fieldErrors.name ? 'true' : undefined}
          aria-describedby={describedBy(fieldErrors.name && 'register-name-error')}
        />
        {errorFor('name') && <FieldError id="register-name-error">{errorFor('name')}</FieldError>}
      </Field>
      <Field>
        <FieldLabel htmlFor="register-email">{t('auth.email')}</FieldLabel>
        <input
          className="input"
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={fieldErrors.email ? 'true' : undefined}
          aria-describedby={describedBy(fieldErrors.email && 'register-email-error')}
        />
        {errorFor('email') && (
          <FieldError id="register-email-error">{errorFor('email')}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="register-password">{t('auth.password')}</FieldLabel>
        <input
          className="input"
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={fieldErrors.password ? 'true' : undefined}
          aria-describedby={describedBy(
            'register-password-hint',
            fieldErrors.password && 'register-password-error',
          )}
        />
        <FieldHint id="register-password-hint">{t('auth.passwordHint')}</FieldHint>
        {errorFor('password') && (
          <FieldError id="register-password-error">{errorFor('password')}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="register-confirm">{t('auth.confirmPassword')}</FieldLabel>
        <input
          className="input"
          id="register-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={fieldErrors.confirmPassword ? 'true' : undefined}
          aria-describedby={describedBy(fieldErrors.confirmPassword && 'register-confirm-error')}
        />
        {errorFor('confirmPassword') && (
          <FieldError id="register-confirm-error">{errorFor('confirmPassword')}</FieldError>
        )}
      </Field>
      <div className="form-foot">
        <Button type="submit" variant="primary" loading={submitting}>
          {t('auth.registerSubmit')}
        </Button>
      </div>
    </form>
  );
}
