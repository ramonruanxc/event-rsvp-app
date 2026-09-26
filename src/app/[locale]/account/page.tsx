import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import type { AccountView } from '@/domain/types';
import { UnauthenticatedError } from '@/domain/errors';
import { getServices } from '@/lib/container';
import { requireUserId } from '@/lib/session';
import { signInRedirectPath } from '@/lib/auth-redirect';
import { SetPasswordForm } from '@/components/set-password-form';
import { setPasswordAction } from './actions';

/** Localized page title (REQ-134). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t('account.title') };
}

/** Account page: set or change the password (REQ-128, REQ-120). */
export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const path = `/${locale}/account`;
  const userId = await requireUserId(path);
  const t = await getTranslations();
  let account: AccountView;
  try {
    account = await getServices().getAccount.execute({ userId });
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect(signInRedirectPath(path));
    throw error;
  }
  return (
    <main className="page">
      <div className="col-640">
        <h1 className="h2">{t('account.title')}</h1>
        {account.email && (
          <p className="muted">{t('account.signedInEmail', { email: account.email })}</p>
        )}
        <div className="panel">
          <SetPasswordForm hasPassword={account.hasPassword} submit={setPasswordAction} />
        </div>
      </div>
    </main>
  );
}
