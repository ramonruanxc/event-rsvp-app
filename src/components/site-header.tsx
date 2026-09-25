import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { signInRedirectPath } from '@/lib/auth-redirect';
import { getCurrentUser } from '@/lib/session';
import { userInitial } from '@/lib/user-initial';
import { signOutAction } from '@/app/[locale]/actions';
import type { Theme } from '@/lib/theme';
import { LogoMark } from '@/components/logo-mark';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { buttonClass } from '@/components/ui/button';
import { LocaleSwitcher } from './locale-switcher';

/** Top-of-page navigation: brand, language switcher, theme toggle and account menu (REQ-64, REQ-75, REQ-80). */
export async function SiteHeader({ locale, theme }: { locale: string; theme: Theme }) {
  const t = await getTranslations();
  const user = await getCurrentUser();

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
          {user ? (
            <UserMenu
              name={user.name}
              initial={userInitial(user.name, user.email)}
              signOutAction={signOutAction.bind(null, locale)}
            />
          ) : (
            <a
              className={buttonClass('secondary', 'sm')}
              href={signInRedirectPath(`/${locale}/dashboard`)}
            >
              {t('nav.signIn')}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
