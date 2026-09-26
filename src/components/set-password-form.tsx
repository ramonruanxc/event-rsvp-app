'use client';

import { useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ValidationError, type FieldErrors } from '@/domain/errors';
import { setPasswordInputSchema, type SetPasswordFormValues } from '@/domain/schemas';
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

/** Maps SetPasswordForm field names to their control ids (REQ-137). */
const ACCOUNT_FIELD_IDS = {
  currentPassword: 'account-current',
  newPassword: 'account-new',
  confirmPassword: 'account-confirm',
} as const;

/** Props of {@link SetPasswordForm}. */
export interface SetPasswordFormProps {
  hasPassword: boolean;
  submit: (values: SetPasswordFormValues) => Promise<ActionResult<null>>;
}

/** Sets or changes the signed-in user's password (REQ-128, REQ-120). */
export function SetPasswordForm({ hasPassword, submit }: SetPasswordFormProps): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function errorFor(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): string | null {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { currentPassword, newPassword, confirmPassword };
    const parsed = setPasswordInputSchema.safeParse(values);
    const errors: FieldErrors = parsed.success
      ? {}
      : { ...ValidationError.fromZod(parsed.error).fieldErrors };
    if (hasPassword && currentPassword === '' && !errors.currentPassword)
      errors.currentPassword = 'required';
    if (Object.keys(errors).length > 0) {
      flushSync(() => {
        setFieldErrors(errors);
        setSaved(false);
      });
      focusFirstInvalid(formRef.current, errors, ACCOUNT_FIELD_IDS);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setSaved(false);
    setSubmitting(true);
    const result = await submit(values);
    setSubmitting(false);
    if (result.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
      router.refresh();
      return;
    }
    if (result.code === 'VALIDATION_ERROR') {
      const errors = result.fieldErrors ?? {};
      flushSync(() => setFieldErrors(errors));
      focusFirstInvalid(formRef.current, errors, ACCOUNT_FIELD_IDS);
    } else setFormError(t(`errors.${result.code}`));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <h2 className="h3">
        {t(hasPassword ? 'account.changePasswordTitle' : 'account.setPasswordTitle')}
      </h2>
      {!hasPassword && <p className="hint">{t('account.setPasswordHint')}</p>}
      {formError && <Alert>{formError}</Alert>}
      {hasPassword && (
        <Field>
          <FieldLabel htmlFor="account-current">{t('account.currentPassword')}</FieldLabel>
          <input
            className="input"
            id="account-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-invalid={fieldErrors.currentPassword ? 'true' : undefined}
            aria-describedby={describedBy(fieldErrors.currentPassword && 'account-current-error')}
          />
          {errorFor('currentPassword') && (
            <FieldError id="account-current-error">{errorFor('currentPassword')}</FieldError>
          )}
        </Field>
      )}
      <Field>
        <FieldLabel htmlFor="account-new">{t('account.newPassword')}</FieldLabel>
        <input
          className="input"
          id="account-new"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          aria-invalid={fieldErrors.newPassword ? 'true' : undefined}
          aria-describedby={describedBy(
            'account-new-hint',
            fieldErrors.newPassword && 'account-new-error',
          )}
        />
        <FieldHint id="account-new-hint">{t('auth.passwordHint')}</FieldHint>
        {errorFor('newPassword') && (
          <FieldError id="account-new-error">{errorFor('newPassword')}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="account-confirm">{t('account.confirmNewPassword')}</FieldLabel>
        <input
          className="input"
          id="account-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={fieldErrors.confirmPassword ? 'true' : undefined}
          aria-describedby={describedBy(fieldErrors.confirmPassword && 'account-confirm-error')}
        />
        {errorFor('confirmPassword') && (
          <FieldError id="account-confirm-error">{errorFor('confirmPassword')}</FieldError>
        )}
      </Field>
      <p className="small" role="status">
        {saved ? t('account.passwordSaved') : null}
      </p>
      <div className="form-foot">
        <Button type="submit" variant="primary" loading={submitting}>
          {t('account.savePassword')}
        </Button>
      </div>
    </form>
  );
}
