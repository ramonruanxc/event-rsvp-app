import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { sanitizeCallbackUrl } from '@/lib/auth-redirect';
import { getCurrentUserId } from '@/lib/session';
import { buttonClass } from '@/components/ui/button';
import { RegisterForm } from '@/components/register-form';
import { registerAction } from '../actions';

/** Localized page title (REQ-134). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t('auth.registerTitle') };
}

/** Register page: create a password account and sign in at once (REQ-127, BR-145, BR-146). */
export default async function RegisterPage({
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
          <h1 className="h2">{t('auth.registerTitle')}</h1>
          <RegisterForm callbackUrl={callbackUrl} submit={registerAction} />
          <hr className="divider" />
          <p className="small muted">{t('auth.haveAccount')}</p>
          <div className="btn-row">
            <Link
              className={buttonClass('secondary', 'md')}
              href={{ pathname: '/sign-in', query: { callbackUrl } }}
            >
              {t('auth.signInLink')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
