import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { signInRedirectPath } from '@/lib/auth-redirect';
import { getCurrentUserId } from '@/lib/session';
import { signOutAction } from '@/app/[locale]/actions';
import type { Theme } from '@/lib/theme';
import { LogoMark } from '@/components/logo-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from './locale-switcher';

/** Top-of-page navigation: brand, language switcher, theme toggle and sign-in/out (REQ-64, REQ-75). */
export async function SiteHeader({ locale, theme }: { locale: string; theme: Theme }) {
  const t = await getTranslations();
  const userId = await getCurrentUserId();

  return (
    <header className="topbar">
      <div className="topbar-in">
        <Link className="brand" href="/">
          <LogoMark />
          {t('nav.brand')}
        </Link>
        <div className="topbar-actions">
          <LocaleSwitcher />
          <ThemeToggle initialTheme={theme} />
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
        </div>
      </div>
    </header>
  );
}
