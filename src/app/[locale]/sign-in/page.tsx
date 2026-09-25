import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { sanitizeCallbackUrl } from '@/lib/auth-redirect';
import { getCurrentUserId } from '@/lib/session';
import { buttonClass } from '@/components/ui/button';
import { Alert } from '@/components/ui/field';
import { GoogleMark } from '@/components/google-mark';
import { PasswordSignInForm } from '@/components/password-sign-in-form';
import { signInWithPasswordAction } from '../actions';

/** Sign-in page: Google or email and password, then back to the callback path (REQ-126, BR-154, BR-95). */
export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const raw = typeof query.callbackUrl === 'string' ? query.callbackUrl : undefined;
  const callbackUrl = raw ? sanitizeCallbackUrl(raw) : `/${locale}/dashboard`;
  if (await getCurrentUserId()) redirect(callbackUrl);
  const t = await getTranslations();

  return (
    <main className="page">
      <div className="col-640">
        <div className="panel">
          <h1 className="h2">{t('auth.signInTitle')}</h1>
          {typeof query.error === 'string' && <Alert>{t('auth.signInFailed')}</Alert>}
          <div className="btn-row">
            <a
              className={buttonClass('secondary', 'lg')}
              href={`/api/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              <GoogleMark />
              {t('auth.continueWithGoogle')}
            </a>
          </div>
          <hr className="divider" />
          <PasswordSignInForm callbackUrl={callbackUrl} submit={signInWithPasswordAction} />
          <hr className="divider" />
          <p className="small muted">{t('auth.noAccount')}</p>
          <div className="btn-row">
            <Link
              className={buttonClass('secondary', 'md')}
              href={{ pathname: '/register', query: { callbackUrl } }}
            >
              {t('auth.createAccount')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
