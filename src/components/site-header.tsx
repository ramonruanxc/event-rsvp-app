import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { signInRedirectPath } from '@/lib/auth-redirect';
import { getCurrentUserId } from '@/lib/session';
import { signOutAction } from '@/app/[locale]/actions';
import { LocaleSwitcher } from './locale-switcher';

/** Top-of-page navigation: brand, language switcher and sign-in/out (REQ-54). */
export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations();
  const userId = await getCurrentUserId();

  return (
    <header>
      <Link href="/">{t('nav.brand')}</Link>
      <LocaleSwitcher />
      {userId ? (
        <>
          <Link href="/dashboard">{t('nav.myEvents')}</Link>
          <form action={signOutAction.bind(null, locale)}>
            <button type="submit">{t('nav.signOut')}</button>
          </form>
        </>
      ) : (
        <a href={signInRedirectPath(`/${locale}/dashboard`)}>{t('nav.signIn')}</a>
      )}
    </header>
  );
}
