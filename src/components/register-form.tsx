'use client';

import { useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { ValidationError, type FieldErrors } from '@/domain/errors';
import { registerInputSchema, type RegisterFormValues } from '@/domain/schemas';
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

/** Maps RegisterForm field names to their control ids (REQ-137). */
const REGISTER_FIELD_IDS = {
  name: 'register-name',
  email: 'register-email',
  password: 'register-password',
  confirmPassword: 'register-confirm',
} as const;

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
  const formRef = useRef<HTMLFormElement>(null);

  function errorFor(field: 'name' | 'email' | 'password' | 'confirmPassword'): string | null {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  }

  /** Shows field errors, then focuses the first invalid field (REQ-137). */
  function showFieldErrors(errors: FieldErrors) {
    flushSync(() => {
      setFieldErrors(errors);
      setFormError(null);
    });
    focusFirstInvalid(formRef.current, errors, REGISTER_FIELD_IDS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: RegisterFormValues = { name, email, password, confirmPassword };
    const parsed = registerInputSchema.safeParse(values);
    if (!parsed.success) {
      showFieldErrors(ValidationError.fromZod(parsed.error).fieldErrors);
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
      showFieldErrors(result.fieldErrors ?? {});
      return;
    }
    setFormError(
      result.code === 'RATE_LIMITED' ? t('auth.tooManyAttempts') : t(`errors.${result.code}`),
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
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
